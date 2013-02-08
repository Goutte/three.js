/**
 * @author timothypratley / https://github.com/timothypratley
 * @author Goutte
 */

THREE.IcosahedronGeometry = function ( radius, detail ) {

  var t = ( 1 + Math.sqrt( 5 ) ) / 2;

  var vertices = [
    [ -1,  t,  0 ], [  1, t, 0 ], [ -1, -t,  0 ], [  1, -t,  0 ],
    [  0, -1,  t ], [  0, 1, t ], [  0, -1, -t ], [  0,  1, -t ],
    [  t,  0, -1 ], [  t, 0, 1 ], [ -t,  0, -1 ], [ -t,  0,  1 ]
  ];

  var faces = [
    [  0, 11,  5 ], [  0,  5,  1 ], [  0,  1,  7 ], [  7,  1,  8 ], [  8,  6,  7 ],
    [ 10,  7,  6 ], [  0,  7, 10 ], [  0, 10, 11 ], [ 11, 10,  2 ], [  6,  2, 10 ],
    [  3,  2,  6 ], [  3,  6,  8 ], [  3,  8,  9 ], [  3,  9,  4 ], [  3,  4,  2 ],
    [  2,  4, 11 ], [  5, 11,  4 ], [  4,  9,  5 ], [  1,  5,  9 ], [  9,  8,  1 ]
  ];

  THREE.PolyhedronGeometry.call( this, vertices, faces, radius, detail );

};

THREE.IcosahedronGeometry.prototype = Object.create( THREE.Geometry.prototype );
