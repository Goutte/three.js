/**
 *
 *
 * @author Goutte / http://github.com/Goutte
 */

THREE.SkySpherePlugin = function () {

  var mapperFunction = function ( theta, phi ) {
    return 0xFF3399;
  };

  var _gl, _renderer, _precision, _lensFlare = {};

  this.init = function ( renderer ) {

    _gl = renderer.context;
    _renderer = renderer;
    _precision = renderer.getPrecision();


    console.log( "_GL", _gl );

//    _gl.clearColor( 1, 1, 1, 1 );
//    _gl.enable( _gl.BLEND );
//
//    _gl.enable( _gl.CULL_FACE );
//    _gl.frontFace( _gl.CCW );

//    _gl.cullFace( _gl.BACK);

//    if ( _renderer.shadowMapCullFace === THREE.CullFaceFront ) {
//
//      _gl.cullFace( _gl.FRONT );
//
//    } else {
//
//      _gl.cullFace( _gl.BACK );
//
//    }

//    _renderer.setDepthTest( true );


  };


  this.render = function ( scene, camera, viewportWidth, viewportHeight ) {


//    _renderer.setDepthTest( true );
//    _renderer.setDepthWrite( true );


    var vertices = [
      -0.5, -0.5,
       0.5, -0.5,
       0.0,  0.5
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

    var vs = 'attribute vec2 pos; ' + "\n" +
      'attribute vec4 color; ' + "\n" +
      'varying vec4 vColor; ' + "\n" +
      'void main() { gl_Position = vec4(pos, 1.0, 1); vColor = color; }';
    var fs = 'precision mediump float; ' + "\n" +
      'varying vec4 vColor; ' +
      'void main() { gl_FragColor = vColor; }';

    var program = createProgram( vs, fs );
    _gl.useProgram( program );


    program.vertexPosAttrib = _gl.getAttribLocation( program, 'pos' );
    _gl.enableVertexAttribArray( program.vertexPosAttrib );

    program.vertexColorAttrib = _gl.getAttribLocation( program, 'color' );
    _gl.enableVertexAttribArray( program.vertexColorAttrib );


    _gl.bindBuffer( _gl.ARRAY_BUFFER, vertexPosBuffer );
    _gl.vertexAttribPointer( program.vertexPosAttrib, 2, _gl.FLOAT, false, 0, 0 );

    _gl.bindBuffer( _gl.ARRAY_BUFFER, triangleVertexColorBuffer );
    _gl.vertexAttribPointer( program.vertexColorAttrib, triangleVertexColorBuffer.itemSize, _gl.FLOAT, false, 0, 0 );

    _gl.drawArrays( _gl.TRIANGLES, 0, 3 );


//		var flares = scene.__webglFlares,
//			nFlares = flares.length;

//		if ( ! nFlares ) return;

//    console.log("scene",scene,"cam",camera,viewportWidth, viewportHeight);

//		var tempPosition = new THREE.Vector3();
//
//		var invAspect = viewportHeight / viewportWidth,
//			halfViewportWidth = viewportWidth * 0.5,
//			halfViewportHeight = viewportHeight * 0.5;
//
//		var size = 16 / viewportHeight,
//			scale = new THREE.Vector2( size * invAspect, size );
//
//		var screenPosition = new THREE.Vector3( 1, 1, 0 ),
//			screenPositionPixels = new THREE.Vector2( 1, 1 );

//		var uniforms = _lensFlare.uniforms,
//			attributes = _lensFlare.attributes;
//
//		// set _lensFlare program and reset blending
//
//		_gl.useProgram( _lensFlare.program );
//
//		_gl.enableVertexAttribArray( _lensFlare.attributes.vertex );
//		_gl.enableVertexAttribArray( _lensFlare.attributes.uv );
//
//		// loop through all lens flares to update their occlusion and positions
//		// setup gl and common used attribs/unforms
//
//		_gl.uniform1i( uniforms.occlusionMap, 0 );
//		_gl.uniform1i( uniforms.map, 1 );
//
//		_gl.bindBuffer( _gl.ARRAY_BUFFER, _lensFlare.vertexBuffer );
//		_gl.vertexAttribPointer( attributes.vertex, 2, _gl.FLOAT, false, 2 * 8, 0 );
//		_gl.vertexAttribPointer( attributes.uv, 2, _gl.FLOAT, false, 2 * 8, 8 );
//
//		_gl.bindBuffer( _gl.ELEMENT_ARRAY_BUFFER, _lensFlare.elementBuffer );
//
//		_gl.disable( _gl.CULL_FACE );
//		_gl.depthMask( false );

//		var i, j, jl, flare, sprite;
//
//		for ( i = 0; i < nFlares; i ++ ) {
//
//			size = 16 / viewportHeight;
//			scale.set( size * invAspect, size );
//
//			// calc object screen position
//
//			flare = flares[ i ];
//
//			tempPosition.set( flare.matrixWorld.elements[12], flare.matrixWorld.elements[13], flare.matrixWorld.elements[14] );
//
//			tempPosition.applyMatrix4( camera.matrixWorldInverse );
//			tempPosition.applyProjection( camera.projectionMatrix );
//
//			// setup arrays for gl programs
//
//			screenPosition.copy( tempPosition )
//
//			screenPositionPixels.x = screenPosition.x * halfViewportWidth + halfViewportWidth;
//			screenPositionPixels.y = screenPosition.y * halfViewportHeight + halfViewportHeight;
//
//			// screen cull
//
//			if ( _lensFlare.hasVertexTexture || (
//				screenPositionPixels.x > 0 &&
//				screenPositionPixels.x < viewportWidth &&
//				screenPositionPixels.y > 0 &&
//				screenPositionPixels.y < viewportHeight ) ) {
//
//				// save current RGB to temp texture
//
//				_gl.activeTexture( _gl.TEXTURE1 );
//				_gl.bindTexture( _gl.TEXTURE_2D, _lensFlare.tempTexture );
//				_gl.copyTexImage2D( _gl.TEXTURE_2D, 0, _gl.RGB, screenPositionPixels.x - 8, screenPositionPixels.y - 8, 16, 16, 0 );
//
//
//				// render pink quad
//
//				_gl.uniform1i( uniforms.renderType, 0 );
//				_gl.uniform2f( uniforms.scale, scale.x, scale.y );
//				_gl.uniform3f( uniforms.screenPosition, screenPosition.x, screenPosition.y, screenPosition.z );
//
//				_gl.disable( _gl.BLEND );
//				_gl.enable( _gl.DEPTH_TEST );
//
//				_gl.drawElements( _gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0 );
//
//
//				// copy result to occlusionMap
//
//				_gl.activeTexture( _gl.TEXTURE0 );
//				_gl.bindTexture( _gl.TEXTURE_2D, _lensFlare.occlusionTexture );
//				_gl.copyTexImage2D( _gl.TEXTURE_2D, 0, _gl.RGBA, screenPositionPixels.x - 8, screenPositionPixels.y - 8, 16, 16, 0 );
//
//
//				// restore graphics
//
//				_gl.uniform1i( uniforms.renderType, 1 );
//				_gl.disable( _gl.DEPTH_TEST );
//
//				_gl.activeTexture( _gl.TEXTURE1 );
//				_gl.bindTexture( _gl.TEXTURE_2D, _lensFlare.tempTexture );
//				_gl.drawElements( _gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0 );
//
//
//				// update object positions
//
//				flare.positionScreen.copy( screenPosition )
//
//				if ( flare.customUpdateCallback ) {
//
//					flare.customUpdateCallback( flare );
//
//				} else {
//
//					flare.updateLensFlares();
//
//				}
//
//				// render flares
//
//				_gl.uniform1i( uniforms.renderType, 2 );
//				_gl.enable( _gl.BLEND );
//
//				for ( j = 0, jl = flare.lensFlares.length; j < jl; j ++ ) {
//
//					sprite = flare.lensFlares[ j ];
//
//					if ( sprite.opacity > 0.001 && sprite.scale > 0.001 ) {
//
//						screenPosition.x = sprite.x;
//						screenPosition.y = sprite.y;
//						screenPosition.z = sprite.z;
//
//						size = sprite.size * sprite.scale / viewportHeight;
//
//						scale.x = size * invAspect;
//						scale.y = size;
//
//						_gl.uniform3f( uniforms.screenPosition, screenPosition.x, screenPosition.y, screenPosition.z );
//						_gl.uniform2f( uniforms.scale, scale.x, scale.y );
//						_gl.uniform1f( uniforms.rotation, sprite.rotation );
//
//						_gl.uniform1f( uniforms.opacity, sprite.opacity );
//						_gl.uniform3f( uniforms.color, sprite.color.r, sprite.color.g, sprite.color.b );
//
//						_renderer.setBlending( sprite.blending, sprite.blendEquation, sprite.blendSrc, sprite.blendDst );
//						_renderer.setTexture( sprite.texture, 1 );
//
//						_gl.drawElements( _gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0 );
//
//					}
//
//				}
//
//			}
//
//		}
//
//		// restore gl
//
//		_gl.enable( _gl.CULL_FACE );
//		_gl.enable( _gl.DEPTH_TEST );
//		_gl.depthMask( true );

  };

//	function createProgram ( shader, precision ) {
//
//		var program = _gl.createProgram();
//
//		var fragmentShader = _gl.createShader( _gl.FRAGMENT_SHADER );
//		var vertexShader = _gl.createShader( _gl.VERTEX_SHADER );
//
//		var prefix = "precision " + precision + " float;\n";
//
//		_gl.shaderSource( fragmentShader, prefix + shader.fragmentShader );
//		_gl.shaderSource( vertexShader, prefix + shader.vertexShader );
//
//		_gl.compileShader( fragmentShader );
//		_gl.compileShader( vertexShader );
//
//		_gl.attachShader( program, fragmentShader );
//		_gl.attachShader( program, vertexShader );
//
//		_gl.linkProgram( program );
//
//		return program;
//
//	};

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

};
