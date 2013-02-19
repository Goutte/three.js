/**
 * Pentagonal face
 *
 * @param o The index of the center vertice
 * @param a
 * @param b
 * @param c
 * @param d
 * @param e
 * @constructor
 */
THREE.FacePentagon = function ( o, a, b, c, d, e ) {

  this.o = o;
  this.a = a;
  this.b = b;
  this.c = c;
  this.d = d;
  this.e = e;

};

THREE.FacePentagon.prototype = {

  constructor: THREE.FacePentagon,

  clone: function () {

    var face = new THREE.FacePentagon( this.o, this.a, this.b, this.c, this.d, this.e );

    return face;

  }

};

/**
 * Hexagonal face
 *
 * @param o The index of the center vertice
 * @param a
 * @param b
 * @param c
 * @param d
 * @param e
 * @param f
 * @constructor
 */
THREE.FaceHexagon = function ( o, a, b, c, d, e, f ) {

  // these are vertex indexes
  this.o = o; // center
  this.a = a;
  this.b = b;
  this.c = c;
  this.d = d;
  this.e = e;
  this.f = f;

};

THREE.FaceHexagon.prototype = {

  constructor: THREE.FaceHexagon,

  clone: function () {

    var face = new THREE.FaceHexagon( this.o, this.a, this.b, this.c, this.d, this.e, this.f );

    return face;

  }

};


/**
 * Get all vertices' indexes that are adjacent to the vertex indexed at vertexIndex
 *
 * @param vertexIndex
 * @return {Array}
 */
THREE.Geometry.prototype.getAdjacentVerticesIndexesFromVertexIndex = function ( vertexIndex ) {
  var
    faceIndices = [ 'a', 'b', 'c', 'd' ], n,
    face, faces = this.getFacesFromVertexIndex( vertexIndex ),
    index,
    verticesIds = [];

  for ( var i = 0, l = faces.length; i < l; i++ ) {
    face = faces[ i ];

    n = ( face instanceof THREE.Face3 ) ? 3 : 4;

    for ( var j = 0; j < n; j++ ) {
      index = face[ faceIndices[ j ] ];
      if ( vertexIndex != index && verticesIds.indexOf( index ) === -1 ) {
        verticesIds.push( index );
      }
    }
  }

  return verticesIds;
};


/**
 * Get faces that use the vertex indexed at vertexIndex
 *
 * @param vertexIndex
 */
THREE.Geometry.prototype.getFacesFromVertexIndex = function ( vertexIndex ) {
  var faceIndices = [ 'a', 'b', 'c', 'd' ];
  var n, face, faces = [];

  for ( var i = 0, fl = this.faces.length; i < fl; i++ ) {

    face = this.faces[ i ];

    n = ( face instanceof THREE.Face3 ) ? 3 : 4;

    for ( var j = 0; j < n; j++ ) {

      if ( vertexIndex == face[ faceIndices[ j ] ] ) {

        faces.push( face );

      }

    }

  }

  return faces;
};

/**
 * Ugly sorter
 *
 * @param faces
 * @return {Array}
 */
THREE.Geometry.prototype.sortFaces3ByAdjacency = function ( faces ) {

  var
    sortedFaces = [],
    remainingFaces = faces,
    fl = faces.length;

  function getFaceVerticesIndices( face ) {
    var faceIndices = [ 'a', 'b', 'c', 'd' ];
    var n = ( face instanceof THREE.Face3 ) ? 3 : 4;
    var vertices = [];

    for ( var j = 0; j < n; j++ ) {
      vertices.push( face[ faceIndices[ j ] ] );
    }

    return vertices;
  }

  function areAdjacent( faceA, faceB ) {
    var
      verticesA = getFaceVerticesIndices( faceA ),
      verticesB = getFaceVerticesIndices( faceB ),
      found = 0;

    for ( var i = 0, l = verticesA.length; i < l; i++ ) {
      if ( verticesB.indexOf( verticesA[ i ] ) !== -1 ) {
        found++;
      }
    }

    return ( found > 1 );
  }

  function findAdjacentFaces( needle, haystack ) {
    var face, faces = [];

    for ( var i = 0, l = haystack.length; i < l; i++ ) {

      face = haystack[ i ];

      if ( areAdjacent( needle, face ) ) {
        faces.push( face );
      }

    }

    return faces;
  }


  var currentFace = remainingFaces.shift();

  sortedFaces.push( currentFace );


  for ( var i = 1; i < fl; i++ ) {

    var adjacentFaces = findAdjacentFaces( currentFace, remainingFaces );

    if ( adjacentFaces.length === 0 ) throw new Error( 'Non continuus set, using first set element as starting point.' );

    var chosenAdjacentFace = adjacentFaces[0];

    sortedFaces.push( chosenAdjacentFace );
    remainingFaces.splice( remainingFaces.indexOf( chosenAdjacentFace ), 1 );
    currentFace = chosenAdjacentFace;

  }

  return sortedFaces;
};


/**
 * http://en.wikipedia.org/wiki/Geodesic_grid
 * It is made of 12 pentagons and, if detail > 1, ( ( 10 * ( 4 ^ detail ) - 30 ) / 3 ) hexagons
 * It looks like a golf ball at detail = 3
 *
 * It builds the geometry by computing the Icosahedron's dual polyhedron.
 *
 * ¡ very slow !
 *
 * @author Goutte / https://github.com/Goutte
 *
 * @param radius Optional, default 1
 * @param detail Optional, default 0
 */
THREE.GeodesicGeometry = function ( radius, detail ) {

  THREE.IcosahedronGeometry.call( this, radius, detail );

  this.hexagonalFaces = []; // holds the hexagonal meta-faces
  this.pentagonalFaces = []; // holds the 12 pentagonal meta-faces
  this.centerVertices = this.vertices.slice( 0 ); // vertices at the center of the hexagonal or pentagonal faces

  var newVertices = this.vertices.slice( 0 );
  var newFaces = [];

  // tmp vars
  var
    i, j, k, l,
    face, faceA, faceB,
    a, b, c,
    vA, vB, vC,
    aVI,
    cb = new THREE.Vector3(),
    ab = new THREE.Vector3();


  // compute new vertices
  for ( i = 0, l = this.faces.length; i < l; i++ ) {
    this.faces[ i ]._centroidVertexIndex = newVertices.length;
    newVertices.push( new THREE.Vector3().copy( this.faces[ i ].centroid ).setLength( radius ) );
  }

  // compute new faces
  for ( i = 0, l = this.centerVertices.length; i < l; i++ ) {

    var adjacentFaces = this.getFacesFromVertexIndex( i );
    adjacentFaces = this.sortFaces3ByAdjacency( adjacentFaces );
    //this.sortFaces3ByAdjacency( adjacentFaces );
    var afl = adjacentFaces.length;


    for ( j = 0; j < afl; j++ ) {
      faceA = adjacentFaces[j];
      faceB = adjacentFaces[(j + 1) % afl];
      a = i;
      b = faceA._centroidVertexIndex;
      c = faceB._centroidVertexIndex;

      if ( a === -1 || b === -1 || c === -1 ) throw new Error( 'Houston, we have a problem !' );

      // make sure the new face faces outwards

      vA = newVertices[ a ];
      vB = newVertices[ b ];
      vC = newVertices[ c ];

      cb.subVectors( vC, vB );
      ab.subVectors( vA, vB );
      cb.cross( ab );

      if ( cb.dot( vA ) >= 0 ) {
        newFaces.push( new THREE.Face3( a, b, c, null, faceA.color, faceA.materialIndex ) );
      } else {
        newFaces.push( new THREE.Face3( b, a, c, null, faceA.color, faceA.materialIndex ) );
      }

    }
  }


  this.vertices = newVertices;
  this.faces = newFaces;


  // compute hexagonal and pentagonal faces
  for ( i = 0, l = this.centerVertices.length; i < l; i++ ) {

    aVI = this.getAdjacentVerticesIndexesFromVertexIndex( i );

    if ( aVI.length === 5 ) {

      face = new THREE.FacePentagon( i, aVI[0], aVI[1], aVI[2], aVI[3], aVI[4] );
      this.vertices[ i ].setLength( this.getCentroidOfPentagonalFace( face ).length() );

      this.pentagonalFaces.push( face );

    } else if ( aVI.length === 6 ) {

      face = new THREE.FaceHexagon( i, aVI[0], aVI[1], aVI[2], aVI[3], aVI[4], aVI[5] );
      this.vertices[ i ].setLength( this.getCentroidOfHexagonalFace( face ).length() );

      this.hexagonalFaces.push( face );

    }
    else {
      throw new Error( 'Weird unexpected face !' );
    }

  }

  this.computeFaceNormals();
  this.computeVertexNormals();

};

THREE.GeodesicGeometry.prototype = Object.create( THREE.Geometry.prototype );


THREE.extend( THREE.GeodesicGeometry.prototype, {

  /**
   * Computes the median of the edge vertices
   *
   * @param {THREE.FacePentagon} pentagonalFace
   * @return {THREE.Vector3}
   */
  getCentroidOfPentagonalFace: function ( pentagonalFace ) {
    var centroid = new THREE.Vector3();

    centroid.add( this.vertices[pentagonalFace.a] );
    centroid.add( this.vertices[pentagonalFace.b] );
    centroid.add( this.vertices[pentagonalFace.c] );
    centroid.add( this.vertices[pentagonalFace.d] );
    centroid.add( this.vertices[pentagonalFace.e] );

    return centroid.divideScalar( 5 );
  },

  /**
   * Computes the median of the edge vertices
   *
   * @param {THREE.FaceHexagon} hexagonalFace
   * @return {THREE.Vector3}
   */
  getCentroidOfHexagonalFace: function ( hexagonalFace ) {
    var centroid = new THREE.Vector3();

    centroid.add( this.vertices[hexagonalFace.a] );
    centroid.add( this.vertices[hexagonalFace.b] );
    centroid.add( this.vertices[hexagonalFace.c] );
    centroid.add( this.vertices[hexagonalFace.d] );
    centroid.add( this.vertices[hexagonalFace.e] );
    centroid.add( this.vertices[hexagonalFace.f] );

    return centroid.divideScalar( 6 );
  }

} );

