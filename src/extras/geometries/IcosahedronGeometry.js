
/**
 * 20 faces (equilateral triangles) with default detail 0.
 * Each detail level subdivides the faces in 4, triforce-style.
 * Faces are sorted so that they are adjacent with their N-1 and N+1,
 * except between the 0 and 19 (fixme)
 *
 * @author timothypratley / https://github.com/timothypratley
 * @author Goutte / https://github.com/Goutte
 *
 * @param radius Optional, default 1
 * @param detail Optional, default 0
 */
THREE.IcosahedronGeometry = function ( radius, detail ) {

  var g = ( 1 + Math.sqrt( 5 ) ) / 2;

  var vertices = [
    [ -1,  g,  0 ], [  1, g, 0 ], [ -1, -g,  0 ], [  1, -g,  0 ],
    [  0, -1,  g ], [  0, 1, g ], [  0, -1, -g ], [  0,  1, -g ],
    [  g,  0, -1 ], [  g, 0, 1 ], [ -g,  0, -1 ], [ -g,  0,  1 ]
  ];

  var faces = [ // storing vertices' ids
    [  0, 11,  5 ], [  0,  5,  1 ], [  0,  1,  7 ], [  7,  1,  8 ],
    [  8,  6,  7 ], [ 10,  7,  6 ], [  0,  7, 10 ], [  0, 10, 11 ],
    [ 11, 10,  2 ], [  6,  2, 10 ], [  3,  2,  6 ], [  3,  6,  8 ],
    [  3,  8,  9 ], [  3,  9,  4 ], [  3,  4,  2 ], [  2,  4, 11 ],
    [  5, 11,  4 ], [  4,  9,  5 ], [  1,  5,  9 ], [  9,  8,  1 ]
  ];

  THREE.PolyhedronGeometry.call( this, vertices, faces, radius, detail );


  // Recalculate UVs
  // not optimized, and it wastes the UV calculus in PolyhedronGeometry

  // UVs for each base face, matching http://upload.wikimedia.org/wikipedia/commons/d/dd/Icosahedron_flat.svg
  var u = 2/11, v = 1/3;
  var uvFaces = [
     [[u,v],[u/2, 0],[0,v]]
    ,[[u,v],[0,v],[u/2,2*v]]
    ,[[u,v],[u/2,2*v],[3*u/2,2*v]]
    ,[[3*u/2,2*v],[u/2,2*v],[u,3*v]]

    ,[[2*u,3*v],[5*u/2,2*v],[3*u/2,2*v]]
    ,[[2*u,v],[3*u/2,2*v],[5*u/2,2*v]]
    ,[[u,v],[3*u/2,2*v],[2*u,v]]
    ,[[u,v],[2*u,v],[3*u/2,0]]

    ,[[5*u/2],[2*u,v],[3*u,v]]
    ,[[5*u/2,2*v],[3*u,v],[2*u,v]]
    ,[[7*u/2,2*v],[3*u,v],[5*u/2,2*v]]
    ,[[7*u/2,2*v],[5*u/2,2*v],[3*u,3*v]]

    ,[[7*u/2,2*v],[4*u,3*v],[9*u/2,2*v]]
    ,[[7*u/2,2*v],[9*u/2,2*v],[4*u, v]]
    ,[[7*u/2,2*v],[4*u, v],[3*u,v]]
    ,[[3*u,v],[4*u, v],[7*u/2,0]]

    ,[[5*u,v],[9*u/2,0],[4*u,v]]
    ,[[4*u,v],[9*u/2,2*v],[5*u,v]]
    ,[[11*u/2,2*v],[5*u,v],[9*u/2,2*v]]
    ,[[9*u/2,2*v],[5*u,3*v],[11*u/2,2*v]]
  ];

  uvFaces.forEach(function(faceUvs, i){
    faceUvs.forEach(function(uv, j){
      uvFaces[i][j] = new THREE.Vector2(uv[0],uv[1]);
    });
  });


  var that = this;

  if ( detail == 0 ) {
    this.faceVertexUvs[ 0 ] = uvFaces;
  } else {
    this.faceVertexUvs[ 0 ] = [];
    uvFaces.forEach( function ( faceUvs, i ) {
      addOrsubdivide( faceUvs[0], faceUvs[1], faceUvs[2], detail );
    } );
  }


  /**
   * Adds recursively the UVs to this.faceVertexUvs
   *
   * @param uvA
   * @param uvB
   * @param uvC
   * @param detail
   */
  function addOrsubdivide( uvA, uvB, uvC, detail ) {

    if ( detail < 1 ) {
      that.faceVertexUvs[ 0 ].push( [ uvA, uvB, uvC ] );
    } else {
      detail -= 1;
      // split triangle into 4 smaller triangles
      addOrsubdivide( uvA, median( uvA, uvB ), median( uvA, uvC ), detail ); // top quadrant
      addOrsubdivide( median( uvA, uvB ), uvB, median( uvB, uvC ), detail ); // left quadrant
      addOrsubdivide( median( uvA, uvC ), median( uvB, uvC ), uvC, detail ); // right quadrant
      addOrsubdivide( median( uvA, uvB ), median( uvB, uvC ), median( uvA, uvC ), detail ); // center quadrant
    }

  }

  /**
   * Median Vector2
   *
   * @param v1 Vector2
   * @param v2 Vector2
   * @return Vector2
   */
  function median( v1, v2 ) {

    return new THREE.Vector2().addVectors( v1, v2 ).divideScalar( 2 );

  }




};

THREE.IcosahedronGeometry.prototype = Object.create( THREE.Geometry.prototype );
