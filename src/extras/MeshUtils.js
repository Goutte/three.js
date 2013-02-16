
/**
 * Sets this matrix to be a translation matrix of Vector v
 *
 * @param v THREE.Vector3
 * @param y Deprecated
 * @param z Deprecated
 * @return THREE.Matrix4
 */
THREE.Matrix4.prototype.makeTranslation = function ( v, y, z ) {

  if ( v instanceof THREE.Vector3 ) {
    z = v.z;
    y = v.y;
    v = v.x;
  } else {
    console.warn( "DEPRECATED: Use makeTranslation( Vector3 ) instead" );
  }

  this.set(
    1, 0, 0, v,
    0, 1, 0, y,
    0, 0, 1, z,
    0, 0, 0, 1
  );

  return this;

};

/**
 * Compute and return the area of the face, using memoization for performance.
 *
 * @param faceId Id of the face in the .faces array of geometry
 * @param force  Optional, default to false. Forces re-calculus of area, ignoring ._area buffer
 * @return int Will return 0 if face is not Face3 or Face4
 */
THREE.Geometry.prototype.getFaceArea = function ( faceId, force ) {

  force = force || false;

  var vA, vB, vC, vD, vertices = this.vertices, face = this.faces[faceId];

  if ( !force && face._area !== undefined ) return face._area;

  if ( face instanceof THREE.Face3 ) {

    vA = vertices[ face.a ];
    vB = vertices[ face.b ];
    vC = vertices[ face.c ];

    face._area = THREE.GeometryUtils.triangleArea( vA, vB, vC );

  } else if ( face instanceof THREE.Face4 ) {

    vA = vertices[ face.a ];
    vB = vertices[ face.b ];
    vC = vertices[ face.c ];
    vD = vertices[ face.d ];

    face._area1 = THREE.GeometryUtils.triangleArea( vA, vB, vD );
    face._area2 = THREE.GeometryUtils.triangleArea( vB, vC, vD );

    face._area = face._area1 + face._area2;

  }

  return face._area || 0;
};


/**
 * Some of these methods require the typeface'd helvetiker font available at
 * examples/fonts/helvetiker_regular.typeface.js
 *
 * @author Goutte http://github.com/Goutte
 */

THREE.MeshUtils = {

  /**
   * Draw arrows on the normal of each face
   * /!\ UNTESTED
   *
   * @param mesh
   */
  revealFacesNormals: function ( mesh ) {

    if ( !mesh.geometry instanceof THREE.Geometry ) throw new Error( "Mesh without geometry" );

    var l = mesh.geometry.faces.length;
    if ( 1 > l ) throw 'Mesh must have at least one face';
    mesh.geometry.faces.forEach( function ( face, i ) {
      mesh.add( new THREE.ArrowHelper( face.normal, new THREE.Vector3( 0, 0, 0 ), mesh.geometry.getFaceArea( i, true ), 0xFF3399 ) );
    } );

  },


  /**
   * Requires the typeface'd helvetiker font
   * TODO: make text face away from origin or face sum of vectors going from a neigbor vertice to this vertice
   *
   * @param mesh
   */
  revealVerticesIds: function ( mesh ) {

    if ( !mesh.geometry instanceof THREE.Geometry ) throw new Error( "Mesh without geometry" );

    mesh.geometry.vertices.forEach( function ( v, i ) {

      var id = i.toString();
      var textMesh = new THREE.Mesh( new THREE.TextGeometry( id, { size: 2, height: 0.5, curveSegments: 2, font: "helvetiker" } ) );
      mesh.add( textMesh );
      textMesh.position = v;

    } );

  },


  /**
   * Requires the typeface'd helvetiker font
   * BUG: Breaks on some meshes (OBJ imported, for one)
   *
   * @param mesh
   * @param scale
   */
  revealFacesIds: function ( mesh, scale ) {

    if ( !mesh.geometry instanceof THREE.Geometry ) throw new Error( "Mesh without geometry" );

    var id, textMesh, vertices = mesh.geometry.vertices, l = mesh.geometry.faces.length;
    if ( 1 > l ) throw 'Mesh must have at least one face';

    scale = scale || 1;

    mesh.updateMatrixWorld();

    mesh.geometry.faces.forEach( function ( face, i ) {

      var size = Math.sqrt( mesh.geometry.getFaceArea( i, true ) ) / 3;

      // Create the number geometry and mesh
      id = i.toString();
      textMesh = new THREE.Mesh(
        new THREE.TextGeometry( id, {
          size: 7 * scale * size,
          height: scale * size,
          curveSegments: 3,
          font: "helvetiker"
        } )
      );

      mesh.add( textMesh );

      textMesh.applyMatrix( new THREE.Matrix4().makeTranslation(
        face.normal.clone().multiplyScalar( face.centroid.length() )
      ) );

      textMesh.lookAt( textMesh.position.clone().multiplyScalar( 2 ) ); // look away from origin
      textMesh.updateMatrixWorld();

      var targetVertex = mesh.geometry.vertices[face.a].clone();

      mesh.localToWorld( targetVertex );
      textMesh.worldToLocal( targetVertex );

      targetVertex.normalize();

      var angle = Math.acos( new THREE.Vector3( 0, 1, 0 ).dot( targetVertex ) );
      var cross = new THREE.Vector3( 0, 1, 0 ).cross( targetVertex );

      textMesh.rotation.add( new THREE.Vector3( 0, 0, (cross.z < 0 ? -1 : 1) * angle ) );

      textMesh.geometry.computeBoundingBox();
      var max = textMesh.geometry.boundingBox.max;
      var min = textMesh.geometry.boundingBox.min;
      var off = new THREE.Vector3().subVectors( min, max ).divideScalar( 2 ).sub( min );
      textMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( off ) );

      textMesh.updateMatrixWorld();

      textMesh.add( new THREE.AxisHelper( mesh.geometry.getFaceArea( i, false ) ) );

    } );

  },


  /**
   * Creates children meshes for the bounding sphere and box if they are computed
   *
   * @param mesh
   * @param detail Optional, default to 0. More will add polygons to the sphere.
   */
  revealBoundaries: function ( mesh, detail ) {

    detail = detail || 0;
    if ( !mesh.geometry instanceof THREE.Geometry ) throw new Error( "Mesh without geometry" );

    var boundary = mesh.geometry.boundingSphere;
    if ( boundary instanceof THREE.Sphere ) {
      var sphere = new THREE.SphereGeometry( boundary.radius, (detail + 1) * 8, (detail + 1) * 6 );
      sphere = new THREE.Mesh( sphere );
      sphere.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( boundary.center ) );
      mesh.add( sphere );
    }

    boundary = mesh.geometry.boundingBox;
    if ( boundary instanceof THREE.Box3 ) {
      var xyz = new THREE.Vector3().subVectors( boundary.max, boundary.min );
      var box = new THREE.CubeGeometry( xyz.x, xyz.y, xyz.z );
      box = new THREE.Mesh( box );
      var off = new THREE.Vector3().addVectors( boundary.max, boundary.min ).divideScalar( 2 );
      box.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( off ) );
      mesh.add( box );
    }

  }


};