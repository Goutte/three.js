/**
 * Plugin for THREE.WebGLRenderer, to add as pre-plugin.
 *
 * Renders a background color or texture.
 * This aims to be at least as fast as using a big cube mesh as skybox, but without the camera's near/far constraint
 *
 * THIS IS A WORK IN PROGRESS
 *
 * Usage example :
 * renderer.addPrePlugin(new THREE.SkySpherePlugin({
 *   mode: 'staticImage'
 * }));
 *
 * Powers of 2 : 2 4 8 16 32 64 128 256 1024 2048 4096 8192 16384 32768 65536
 *
 * @param {Object} options Optional, see defaultOptions below
 *
 * @author Goutte / http://github.com/Goutte
 */

THREE.SkySpherePlugin = function ( options ) {

  var defaultOptions = {
    mode: 'staticImage', // test, uniformColor, staticImage
    imageSrc: 'textures/skymap/sky00.jpg' // required by staticImage mode
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

    console.log( "_GL", _gl );

    if ( this.shaders[options.mode] === undefined ) throw new Error( 'Shader ' + options.mode + ' is not defined.' );

    _program = createProgram( this.shaders[options.mode]['vertex'], this.shaders[options.mode]['fragment'] );
    _gl.useProgram( _program );


    if ( this.isUsingTexture() ) {

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

    }

    switch ( options.mode )
    {
      case 'staticImage':
        this.initStaticImage();
        break;
      default:
        break;
    }

//    _gl.clearColor( 1, 1, 1, 1 );
//    _gl.enable( _gl.BLEND );
//
//    _gl.enable( _gl.CULL_FACE );
//    _gl.frontFace( _gl.CCW );

//    _gl.cullFace( _gl.BACK);

//    if ( _renderer.shadowMapCullFace === THREE.CullFaceFront ) {
//      _gl.cullFace( _gl.FRONT );
//    } else {
//      _gl.cullFace( _gl.BACK );
//    }
//    _renderer.setDepthTest( true );


  };

  /**
   * Is this sky sphere using an image texture ?
   *
   * @return {Boolean}
   */
  this.isUsingTexture = function () {
    return (options.mode == 'staticImage');
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
      default:
        if (_isTextureLoaded) this.renderStaticImage( scene, camera, viewportWidth, viewportHeight );
        break;
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
       1.0,  1.0,
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
      1.0, 0.0,
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



    // /!\ duplicate
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexPositionBuffer );
    _gl.vertexAttribPointer( _program.vertexPositionAttribute, _program.vertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0 );
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexUVBuffer );
    _gl.vertexAttribPointer( _program.textureUVAttribute, _program.vertexUVBuffer.itemSize, _gl.FLOAT, false, 0, 0 );


  };


  this.renderStaticImage = function ( scene, camera, viewportWidth, viewportHeight ) {

    // /!\ duplicate
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexPositionBuffer );
    _gl.vertexAttribPointer( _program.vertexPositionAttribute, _program.vertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0 );
    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexUVBuffer );
    _gl.vertexAttribPointer( _program.textureUVAttribute, _program.vertexUVBuffer.itemSize, _gl.FLOAT, false, 0, 0 );



    _gl.activeTexture( _gl.TEXTURE0 );
    _gl.bindTexture( _gl.TEXTURE_2D, _skyTexture );
    _gl.uniform1i( _program.samplerUniform, 0 );


    _gl.bindBuffer( _gl.ARRAY_BUFFER, _program.vertexPositionBuffer );
    _gl.drawArrays( _gl.TRIANGLES, 0, _program.vertexPositionBuffer.numItems );

    //_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    //setMatrixUniforms();
    //_gl.drawElements(_gl.TRIANGLES, cubeVertexIndexBuffer.numItems, _gl.UNSIGNED_SHORT, 0);


//    _gl.viewport(0, 0, _gl.viewportWidth, _gl.viewportHeight);
//    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);


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


//    var vertices = [
//      // Front face
//      -1.0, -1.0, 1.0,
//      1.0, -1.0, 1.0,
//      1.0, 1.0, 1.0,
//      -1.0, 1.0, 1.0,
//
//      // Back face
//      -1.0, -1.0, -1.0,
//      -1.0, 1.0, -1.0,
//      1.0, 1.0, -1.0,
//      1.0, -1.0, -1.0,
//
//      // Top face
//      -1.0, 1.0, -1.0,
//      -1.0, 1.0, 1.0,
//      1.0, 1.0, 1.0,
//      1.0, 1.0, -1.0,
//
//      // Bottom face
//      -1.0, -1.0, -1.0,
//      1.0, -1.0, -1.0,
//      1.0, -1.0, 1.0,
//      -1.0, -1.0, 1.0,
//
//      // Right face
//      1.0, -1.0, -1.0,
//      1.0, 1.0, -1.0,
//      1.0, 1.0, 1.0,
//      1.0, -1.0, 1.0,
//
//      // Left face
//      -1.0, -1.0, -1.0,
//      -1.0, -1.0, 1.0,
//      -1.0, 1.0, 1.0,
//      -1.0, 1.0, -1.0
//    ];


//    var UVs = [
//      // Front face
//      0.0, 0.0,
//      1.0, 0.0,
//      1.0, 1.0,
//      0.0, 1.0,
//
//      // Back face
//      1.0, 0.0,
//      1.0, 1.0,
//      0.0, 1.0,
//      0.0, 0.0,
//
//      // Top face
//      0.0, 1.0,
//      0.0, 0.0,
//      1.0, 0.0,
//      1.0, 1.0,
//
//      // Bottom face
//      1.0, 1.0,
//      0.0, 1.0,
//      0.0, 0.0,
//      1.0, 0.0,
//
//      // Right face
//      1.0, 0.0,
//      1.0, 1.0,
//      0.0, 1.0,
//      0.0, 0.0,
//
//      // Left face
//      0.0, 0.0,
//      1.0, 0.0,
//      1.0, 1.0,
//      0.0, 1.0
//    ];




//    var cubeVertexIndexBuffer = _gl.createBuffer();
//    _gl.bindBuffer( _gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer );
//    var cubeVertexIndices = [
//      0, 1, 2, 0, 2, 3, // Front face
//      4, 5, 6, 4, 6, 7, // Back face
//      8, 9, 10, 8, 10, 11, // Top face
//      12, 13, 14, 12, 14, 15, // Bottom face
//      16, 17, 18, 16, 18, 19, // Right face
//      20, 21, 22, 20, 22, 23  // Left face
//    ];
//    _gl.bufferData( _gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( cubeVertexIndices ), _gl.STATIC_DRAW );
//    cubeVertexIndexBuffer.itemSize = 1;
//    cubeVertexIndexBuffer.numItems = 36;