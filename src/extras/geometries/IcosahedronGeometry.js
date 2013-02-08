
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

  var t = ( 1 + Math.sqrt( 5 ) ) / 2;

  var vertices = [
    [ -1,  t,  0 ], [  1, t, 0 ], [ -1, -t,  0 ], [  1, -t,  0 ],
    [  0, -1,  t ], [  0, 1, t ], [  0, -1, -t ], [  0,  1, -t ],
    [  t,  0, -1 ], [  t, 0, 1 ], [ -t,  0, -1 ], [ -t,  0,  1 ]
  ];

  var faces = [
    [  0, 11,  5 ], [  0,  5,  1 ], [  0,  1,  7 ], [  7,  1,  8 ],
    [  8,  6,  7 ], [ 10,  7,  6 ], [  0,  7, 10 ], [  0, 10, 11 ],
    [ 11, 10,  2 ], [  6,  2, 10 ], [  3,  2,  6 ],

    [  3,  6,  8 ], [  3,  8,  9 ], [  3,  9,  4 ], [  3,  4,  2 ],
    [  2,  4, 11 ], [  5, 11,  4 ], [  4,  9,  5 ], [  1,  5,  9 ], [  9,  8,  1 ]
  ];

  THREE.PolyhedronGeometry.call( this, vertices, faces, radius, detail );

  // monkey-style

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

    ,[[5*u/2],[2*u,v],[3*2,v]]
    ,[[5*u/2,2*v],[3*2,v],[2*u,v]]
    ,[[7*u/2,2*v],[3*2,v],[5*u/2,2*v]]
    ,[[7*u/2,2*v],[5*u/2,2*v],[3*u,3*v]]

    // ... todo

  ];


};

THREE.IcosahedronGeometry.prototype = Object.create( THREE.Geometry.prototype );
