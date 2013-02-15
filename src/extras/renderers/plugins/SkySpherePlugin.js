/**
 * Plugin for THREE.WebGLRenderer, to add as pre-plugin.
 *
 * Renders a background color or texture.
 * This aims to solve the problem of the camera's far constraint
 *
 * fixme THIS IS A WORK IN PROGRESS
 *
 * Usage example :
 * renderer.addPrePlugin(new THREE.SkySpherePlugin({
 *   mode: 'staticImage'
 * }));
 *
 *
 * Notes :
 *
 * If using an image texture, its width and height must both be a power of 2.
 * Powers of 2 : 1 2 4 8 16 32 64 128 256 1024 2048 4096 8192 16384 32768 65536
 *
 * The sphereImage mode adds a big mesh with a sphere geometry.
 * Ideally, it should not add anything to the scene, and render directly ; I spent some time trying, but to no avail.
 *
 * The Sphere UV mapping does not fill the image rectangle, which causes artifacts on poles.
 * Using an icosahedron with a mapping similar to textures/skymap/example_ico_uv.jpg would be better
 *
 *
 * @param {Object} options Optional, see defaultOptions below
 *
 * @author Goutte / http://github.com/Goutte
 */
THREE.SkySpherePlugin = function ( options ) {

  var defaultOptions = {
    mode: 'sphereImage', // test, staticImage, sphereImage
    staticImage: {
      imageSrc: 'textures/skymap/sky00.jpg'
    },
    sphereImage: {
      imageSrc: 'textures/skymap/apocalyptic_room.jpg',
      detail: 3, // more detail adds polygons to the geometry
      radiusIfCameraHasNoFar: 1000,
      materialOptions: {}
    },
    onLoad: function(){} // callback fired when images are loaded fixme: not implemented
  };

  options = options || {};
  options = mergeObjects( options, defaultOptions );


  var _gl, _renderer, _precision, _program,
      _skyTexture, _isTextureLoaded = false;


  /**
   * Called once by THREE.WebGLRenderer to initialize the plugin's variables
   *
   * @param {THREE.WebGLRenderer} renderer
   */
  this.init = function ( renderer ) {

    if (! renderer instanceof THREE.WebGLRenderer) throw new Error('SkySphere only works with WebGL');

    _gl = renderer.context;
    _renderer = renderer;
    _precision = renderer.getPrecision();

    if ( this.shaders[options.mode] !== undefined ) {
      _program = createProgram( this.shaders[options.mode]['vertex'], this.shaders[options.mode]['fragment'] );
      _gl.useProgram( _program );
    }

    switch ( options.mode )
    {
      case 'staticImage':

        function handleLoadedTexture( texture ) {
          _gl.bindTexture( _gl.TEXTURE_2D, texture );
          //_gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, true ); // todo: ask @WestLangley for guidance
          _gl.texImage2D( _gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, texture.image );
          _gl.texParameteri( _gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST );
          _gl.texParameteri( _gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST );
          _gl.bindTexture( _gl.TEXTURE_2D, null );

          _isTextureLoaded = true;
        }

        _skyTexture = _gl.createTexture();
        _skyTexture.image = new Image();
        _skyTexture.image.onload = function () { handleLoadedTexture( _skyTexture ) };
        _skyTexture.image.src = options.imageSrc;

        this.initStaticImage();

        break;

      case 'sphereImage':
        this.initSphereImage( renderer );
        break;

      default:
        break;
    }



  };


  /**
   * Called on each render by THREE.WebGLRenderer
   *
   * @param scene
   * @param camera
   * @param viewportWidth
   * @param viewportHeight
   */
  this.render = function ( scene, camera, viewportWidth, viewportHeight ) {

    _gl.useProgram( _program );

    switch ( options.mode )
    {
      case 'test':
        this.renderTest( scene, camera, viewportWidth, viewportHeight );
        break;

      case 'staticImage':
        if (_isTextureLoaded) this.renderStaticImage( scene, camera, viewportWidth, viewportHeight );
        break;

      case 'sphereImage':
        this.renderSphereImage( scene, camera, viewportWidth, viewportHeight );
        break;

      default:
        throw new Error('SkySphere has no '+options.mode+' mode');
    }

  };

  // STATIC IMAGE //////////////////////////////////////////////////////////////////////////////////////////////////////

  this.initStaticImage = function () {

    _program.vertexPositionBuffer = _gl.createBuffer();
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexPositionBuffer );
    var vertices = [
      -1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0
    ];
    _gl.bufferData( _gl.ARRAY_BUFFER, new Float32Array( vertices ), _gl.STATIC_DRAW );
    _program.vertexPositionBuffer.itemSize = 2;
    _program.vertexPositionBuffer.numItems = vertices.length / _program.vertexPositionBuffer.itemSize;


    _program.vertexUVBuffer = _gl.createBuffer();
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexUVBuffer );
    var UVs = [
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0
    ];
    _gl.bufferData( _gl.ARRAY_BUFFER, new Float32Array( UVs ), _gl.STATIC_DRAW );
    _program.vertexUVBuffer.itemSize = 2;
    _program.vertexUVBuffer.numItems = UVs.length / _program.vertexUVBuffer.itemSize;


    // Bind shaders vars

    _program.vertexPositionAttribute = _gl.getAttribLocation( _program, "aPosition" );
    _gl.enableVertexAttribArray( _program.vertexPositionAttribute );

    _program.textureUVAttribute = _gl.getAttribLocation( _program, "aTextureUV" );
    _gl.enableVertexAttribArray( _program.textureUVAttribute );

    _program.samplerUniform = _gl.getUniformLocation( _program, "uSampler" );


    attribPointersStaticImage();

  };

  this.renderStaticImage = function ( scene, camera, viewportWidth, viewportHeight ) {

    attribPointersStaticImage();

    _gl.activeTexture( _gl.TEXTURE0 );
    _gl.bindTexture( _gl.TEXTURE_2D, _skyTexture );
    _gl.uniform1i( _program.samplerUniform, 0 );

    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexPositionBuffer );
    _gl.drawArrays( _gl.TRIANGLES, 0, _program.vertexPositionBuffer.numItems );

  };

  function attribPointersStaticImage () {
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexPositionBuffer );
    _gl.vertexAttribPointer( _program.vertexPositionAttribute, _program.vertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0 );
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexUVBuffer );
    _gl.vertexAttribPointer( _program.textureUVAttribute, _program.vertexUVBuffer.itemSize, _gl.FLOAT, false, 0, 0 );
  }

  // SPHERE IMAGE //////////////////////////////////////////////////////////////////////////////////////////////////////

  var _skyMesh, _sphereImageInitialized = false;

  this.initSphereImage = function ( renderer ) {};

  this.renderSphereImage = function ( scene, camera, viewportWidth, viewportHeight ) {

    if ( ! _sphereImageInitialized ) {

      _sphereImageInitialized = true;

      var radius = camera.far || options.sphereImage.radiusIfCameraHasNoFar;
      var detail = options.sphereImage.detail;

      var materialOptions = options.sphereImage.materialOptions || {};

      if ( ! materialOptions.map ) {
        materialOptions.map = THREE.ImageUtils.loadTexture( options.sphereImage.imageSrc );
      }

      _skyMesh = new THREE.Mesh( new THREE.SphereGeometry( radius, 8 * detail, 6 * detail ), new THREE.MeshBasicMaterial( materialOptions ) );
      _skyMesh.scale.x = -1; // will show material inside of geometry
      _skyMesh.frustumCulled = false;

      scene.add( _skyMesh );

    }

    _skyMesh.position = camera.position; // make sure the skysphere does not move relatively to the camera

  };



  // TEST //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  this.renderTest = function ( scene, camera, viewportWidth, viewportHeight ) {

    var vertices = [
      -0.5, -0.5,
      0.5, -0.5,
      0.0, 0.5
    ];

    var vertexPosBuffer = _gl.createBuffer();
    _gl.bindBuffer( _gl.ARRAY_BUFFER, vertexPosBuffer );
    _gl.bufferData( _gl.ARRAY_BUFFER, new Float32Array( vertices ), _gl.STATIC_DRAW );

    var colors = [
      1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 0.0, 1.0, 1.0
    ];
    var triangleVertexColorBuffer = _gl.createBuffer();
    _gl.bindBuffer( _gl.ARRAY_BUFFER, triangleVertexColorBuffer );
    _gl.bufferData( _gl.ARRAY_BUFFER, new Float32Array( colors ), _gl.STATIC_DRAW );
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;

    _program.vertexPosAttrib = _gl.getAttribLocation( _program, 'aPosition' );
    _gl.enableVertexAttribArray( _program.vertexPosAttrib );

    _program.vertexColorAttrib = _gl.getAttribLocation( _program, 'aColor' );
    _gl.enableVertexAttribArray( _program.vertexColorAttrib );

    _gl.bindBuffer( _gl.ARRAY_BUFFER, vertexPosBuffer );
    _gl.vertexAttribPointer( _program.vertexPosAttrib, 2, _gl.FLOAT, false, 0, 0 );

    _gl.bindBuffer( _gl.ARRAY_BUFFER, triangleVertexColorBuffer );
    _gl.vertexAttribPointer( _program.vertexColorAttrib, triangleVertexColorBuffer.itemSize, _gl.FLOAT, false, 0, 0 );

    _gl.drawArrays( _gl.TRIANGLES, 0, 3 );

  };


  /**
   * GLSL Shaders for each mode
   * We HAVE GOT to find another way to host these
   * Separate files would be good but would require waiting for them to load => doable, i think
   *
   * @type {Object}
   */
  this.shaders = {
    'test': {
      'vertex': [
        'attribute vec2 aPosition;'
        , 'attribute vec4 aColor;'

        , 'varying   vec4 vColor;'

        , 'void main(){'
        , '  gl_Position = vec4(aPosition, 1.0, 1.0);'
        , '  vColor = aColor;'
        , '}'
      ].join( "\n" ),
      'fragment': [
        'precision mediump float;'

        , 'varying   vec4 vColor;'

        , 'void main(){'
        , '  gl_FragColor = vColor;'
        , '}'
      ].join( "\n" )
    },

    'staticImage': {
      'vertex': [
        'attribute vec2 aPosition;'
        , 'attribute vec2 aTextureUV;'

        , 'varying   vec2 vTextureUV;'

        , 'void main(){'
        , '  gl_Position = vec4(aPosition, 1.0, 1.0);'
        , '  vTextureUV = aTextureUV;'
        , '}'
      ].join( "\n" ),
      'fragment': [
        'precision mediump   float;'

        , 'uniform   sampler2D uSampler;'

        , 'varying   vec2      vTextureUV;'

        , 'void main(){'
        , '  gl_FragColor = texture2D(uSampler, vTextureUV);'
        , '}'
      ].join( "\n" )
    }
  };


  // TODO: find the THREE utils that manage this, to dry the code up

  function mergeObjects( obj1, obj2 ) {
    for ( var p in obj2 ) {
      try {
        // Property in destination object set; update its value.
        if ( obj2[p].constructor == Object ) {
          obj1[p] = mergeObjects( obj1[p], obj2[p] );
        } else {
          obj1[p] = obj2[p];
        }
      } catch ( e ) {
        // Property in destination object not set; create it and set its value.
        obj1[p] = obj2[p];
      }
    }

    return obj1;
  }

  function createShader( str, type ) {
    var shader = _gl.createShader( type );
    _gl.shaderSource( shader, str );
    _gl.compileShader( shader );
    if ( !_gl.getShaderParameter( shader, _gl.COMPILE_STATUS ) ) {
      throw _gl.getShaderInfoLog( shader );
    }
    return shader;
  }

  function createProgram( vstr, fstr ) {
    var program = _gl.createProgram();
    var vshader = createShader( vstr, _gl.VERTEX_SHADER );
    var fshader = createShader( fstr, _gl.FRAGMENT_SHADER );
    _gl.attachShader( program, vshader );
    _gl.attachShader( program, fshader );
    _gl.linkProgram( program );
    if ( !_gl.getProgramParameter( program, _gl.LINK_STATUS ) ) {
      throw _gl.getProgramInfoLog( program );
    }
    return program;
  }

  //////////////////////////////////////////////////////////////////

};