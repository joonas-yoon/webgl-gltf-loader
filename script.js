class Mat4 {
  constructor(mat) {
    this.a = mat || Mat4.IdentityMatrix;
  }

  get mat4() { return this.a; }
  get matrix() { return this.a; }

  static get IdentityMatrix() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  // point • matrix
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
  static multiplyMP(matrix, point) {
    // Give a simple variable name to each part of the matrix, a column and row number
    let c0r0 = matrix[ 0], c1r0 = matrix[ 1], c2r0 = matrix[ 2], c3r0 = matrix[ 3];
    let c0r1 = matrix[ 4], c1r1 = matrix[ 5], c2r1 = matrix[ 6], c3r1 = matrix[ 7];
    let c0r2 = matrix[ 8], c1r2 = matrix[ 9], c2r2 = matrix[10], c3r2 = matrix[11];
    let c0r3 = matrix[12], c1r3 = matrix[13], c2r3 = matrix[14], c3r3 = matrix[15];

    // Multiply the point against each part of the columns, then add together
    let x = point[0], y = point[1], z = point[2], w = point[3];
    let resultX = (x * c0r0) + (y * c0r1) + (z * c0r2) + (w * c0r3);
    let resultY = (x * c1r0) + (y * c1r1) + (z * c1r2) + (w * c1r3);
    let resultZ = (x * c2r0) + (y * c2r1) + (z * c2r2) + (w * c2r3);
    let resultW = (x * c3r0) + (y * c3r1) + (z * c3r2) + (w * c3r3);

    return [resultX, resultY, resultZ, resultW];
  }

  // matrixA • matrixB
  static multiplyMM(matrixA, matrixB) {
    // Slice the second matrix up into rows
    let row0 = [matrixA[ 0], matrixA[ 1], matrixA[ 2], matrixA[ 3]];
    let row1 = [matrixA[ 4], matrixA[ 5], matrixA[ 6], matrixA[ 7]];
    let row2 = [matrixA[ 8], matrixA[ 9], matrixA[10], matrixA[11]];
    let row3 = [matrixA[12], matrixA[13], matrixA[14], matrixA[15]];

    // Multiply each row by matrixA
    let result0 = Mat4.multiplyMP(matrixB, row0);
    let result1 = Mat4.multiplyMP(matrixB, row1);
    let result2 = Mat4.multiplyMP(matrixB, row2);
    let result3 = Mat4.multiplyMP(matrixB, row3);

    // Turn the result rows back into a single matrix
    return [
      result0[0], result0[1], result0[2], result0[3],
      result1[0], result1[1], result1[2], result1[3],
      result2[0], result2[1], result2[2], result2[3],
      result3[0], result3[1], result3[2], result3[3]
    ];
  }

  static translate(mat, x, y, z) {
    let translationMatrix = [
      1,    0,    0,   0,
      0,    1,    0,   0,
      0,    0,    1,   0,
      x,    y,    z,   1
    ];
    return Mat4.multiplyMM(mat, translationMatrix);
  }
  
  static scale(mat, x, y, z) {
    let scaleMatrix  = [
      x,    0,    0,   0,
      0,    y,    0,   0,
      0,    0,    z,   0,
      0,    0,    0,   1
    ];
    return Mat4.multiplyMM(mat, scaleMatrix);
  }

  // https://graphics.stanford.edu/~mdfisher/Code/Engine/Matrix4.cpp.html
  static rotate(m, x, y, z, angle) {
    let sin = Math.sin, cos = Math.cos;
    
    let c = cos(angle);
    let s = sin(angle);
    let t = 1.0 - c;

    function normalize(v) {
      v[0] /= Math.sqrt(m[0]*m[0], m[1]*m[1], m[2]*m[2]);
      v[1] /= Math.sqrt(m[0]*m[0], m[1]*m[1], m[2]*m[2]);
      v[2] /= Math.sqrt(m[0]*m[0], m[1]*m[1], m[2]*m[2]);
      return v;
    }

    const nv = normalize([x, y, z]);
    x = nv[0], y = nv[1], z = nv[2];
    return [
      1 + t*(x*x-1),   z*s+t*x*y,   -y*s+t*x*z, 0.0,
         -z*s+t*x*y, 1+t*(y*y-1),    x*s+t*y*z, 0.0,
          y*s+t*x*z,   -x*s+t*y*z, 1+t*(z*z-1), 0.0,
                0.0,          0.0,         0.0, 1.0
    ];
  }

  static rotateZ(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]-s*m[1];
    m[4] = c*m[4]-s*m[5];
    m[8] = c*m[8]-s*m[9];

    m[1]=c*m[1]+s*mv0;
    m[5]=c*m[5]+s*mv4;
    m[9]=c*m[9]+s*mv8;

    return m;
  }

  static rotateX(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1]*c-m[2]*s;
    m[5] = m[5]*c-m[6]*s;
    m[9] = m[9]*c-m[10]*s;

    m[2] = m[2]*c+mv1*s;
    m[6] = m[6]*c+mv5*s;
    m[10] = m[10]*c+mv9*s;

    return m;
  }

  static rotateY(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]+s*m[2];
    m[4] = c*m[4]+s*m[6];
    m[8] = c*m[8]+s*m[10];

    m[2] = c*m[2]-s*mv0;
    m[6] = c*m[6]-s*mv4;
    m[10] = c*m[10]-s*mv8;

    return m;
  }

  // https://graphics.stanford.edu/~mdfisher/Code/Engine/Matrix4.cpp.html
  static inverse(m) {
    //
    // Inversion by Cramer's rule.  Code taken from an Intel publication
    //
    let result = Mat4.IdentityMatrix;
    let tmp = Mat4.IdentityMatrix; /* temp array for pairs */
    let src = Mat4.IdentityMatrix; /* array of transpose source matrix */
    let det; /* determinant */
    /* transpose matrix */
    for (let i = 0; i < 4; i++) {
        src[i + 0 ] = m[i * 4 + 0];
        src[i + 4 ] = m[i * 4 + 1];
        src[i + 8 ] = m[i * 4 + 2];
        src[i + 12] = m[i * 4 + 3];
    }
    /* calculate pairs for first 8 elements (cofactors) */
    tmp[0] = src[10] * src[15];
    tmp[1] = src[11] * src[14];
    tmp[2] = src[9] * src[15];
    tmp[3] = src[11] * src[13];
    tmp[4] = src[9] * src[14];
    tmp[5] = src[10] * src[13];
    tmp[6] = src[8] * src[15];
    tmp[7] = src[11] * src[12];
    tmp[8] = src[8] * src[14];
    tmp[9] = src[10] * src[12];
    tmp[10] = src[8] * src[13];
    tmp[11] = src[9] * src[12];
    /* calculate first 8 elements (cofactors) */
    result[0*4+0] = tmp[0]*src[5] + tmp[3]*src[6] + tmp[4]*src[7];
    result[0*4+0] -= tmp[1]*src[5] + tmp[2]*src[6] + tmp[5]*src[7];
    result[0*4+1] = tmp[1]*src[4] + tmp[6]*src[6] + tmp[9]*src[7];
    result[0*4+1] -= tmp[0]*src[4] + tmp[7]*src[6] + tmp[8]*src[7];
    result[0*4+2] = tmp[2]*src[4] + tmp[7]*src[5] + tmp[10]*src[7];
    result[0*4+2] -= tmp[3]*src[4] + tmp[6]*src[5] + tmp[11]*src[7];
    result[0*4+3] = tmp[5]*src[4] + tmp[8]*src[5] + tmp[11]*src[6];
    result[0*4+3] -= tmp[4]*src[4] + tmp[9]*src[5] + tmp[10]*src[6];
    result[1*4+0] = tmp[1]*src[1] + tmp[2]*src[2] + tmp[5]*src[3];
    result[1*4+0] -= tmp[0]*src[1] + tmp[3]*src[2] + tmp[4]*src[3];
    result[1*4+1] = tmp[0]*src[0] + tmp[7]*src[2] + tmp[8]*src[3];
    result[1*4+1] -= tmp[1]*src[0] + tmp[6]*src[2] + tmp[9]*src[3];
    result[1*4+2] = tmp[3]*src[0] + tmp[6]*src[1] + tmp[11]*src[3];
    result[1*4+2] -= tmp[2]*src[0] + tmp[7]*src[1] + tmp[10]*src[3];
    result[1*4+3] = tmp[4]*src[0] + tmp[9]*src[1] + tmp[10]*src[2];
    result[1*4+3] -= tmp[5]*src[0] + tmp[8]*src[1] + tmp[11]*src[2];
    /* calculate pairs for second 8 elements (cofactors) */
    tmp[0] = src[2]*src[7];
    tmp[1] = src[3]*src[6];
    tmp[2] = src[1]*src[7];
    tmp[3] = src[3]*src[5];
    tmp[4] = src[1]*src[6];
    tmp[5] = src[2]*src[5];
    tmp[6] = src[0]*src[7];
    tmp[7] = src[3]*src[4];
    tmp[8] = src[0]*src[6];
    tmp[9] = src[2]*src[4];
    tmp[10] = src[0]*src[5];
    tmp[11] = src[1]*src[4];
    /* calculate second 8 elements (cofactors) */
    result[2*4+0] = tmp[0]*src[13] + tmp[3]*src[14] + tmp[4]*src[15];
    result[2*4+0] -= tmp[1]*src[13] + tmp[2]*src[14] + tmp[5]*src[15];
    result[2*4+1] = tmp[1]*src[12] + tmp[6]*src[14] + tmp[9]*src[15];
    result[2*4+1] -= tmp[0]*src[12] + tmp[7]*src[14] + tmp[8]*src[15];
    result[2*4+2] = tmp[2]*src[12] + tmp[7]*src[13] + tmp[10]*src[15];
    result[2*4+2] -= tmp[3]*src[12] + tmp[6]*src[13] + tmp[11]*src[15];
    result[2*4+3] = tmp[5]*src[12] + tmp[8]*src[13] + tmp[11]*src[14];
    result[2*4+3] -= tmp[4]*src[12] + tmp[9]*src[13] + tmp[10]*src[14];
    result[3*4+0] = tmp[2]*src[10] + tmp[5]*src[11] + tmp[1]*src[9];
    result[3*4+0] -= tmp[4]*src[11] + tmp[0]*src[9] + tmp[3]*src[10];
    result[3*4+1] = tmp[8]*src[11] + tmp[0]*src[8] + tmp[7]*src[10];
    result[3*4+1] -= tmp[6]*src[10] + tmp[9]*src[11] + tmp[1]*src[8];
    result[3*4+2] = tmp[6]*src[9] + tmp[11]*src[11] + tmp[3]*src[8];
    result[3*4+2] -= tmp[10]*src[11] + tmp[2]*src[8] + tmp[7]*src[9];
    result[3*4+3] = tmp[10]*src[10] + tmp[4]*src[8] + tmp[9]*src[9];
    result[3*4+3] -= tmp[8]*src[9] + tmp[11]*src[10] + tmp[5]*src[8];
    /* calculate determinant */
    det=src[0]*result[0]+src[1]*result[1]+src[2]*result[2]+src[3]*result[3];
    /* calculate matrix inverse */
    det = 1.0 / det;
    
    for (let i = 0; i < 16; i++) result[i] *= det;
    return result;
  }

  static transpose(m) {
    const result = Mat4.IdentityMatrix;
    for(let i = 0; i < 4; i++) {
      for(let i2 = 0; i2 < 4; i2++) {
        result[i2 * 4 + i] = m[i * 4 + i2];
      }
    }
    return result;
  }

  // test
  test() {
    console.assert(
      Mat4.multiplyMP(Mat4.IdentityMatrix, [4,3,2,1]).toString()
       == [4,3,2,1].toString()
    );
    console.assert(
      Mat4.translate(Mat4.IdentityMatrix, 50, 100, 0).toString()
       == [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 50, 100, 0, 1].toString()
    );
  }
}

class GLTFCommon {
  constructor(gl) {
    this.baseURL = location.href;
    this.url = new URL('.', this.baseURL).href;
    this.gl = gl;
  }

  setGL(gl) {
    this.gl = gl;
  }

  setBaseURL(base) {
    this.baseURL = base || location.href;
  }

  setPath(url, base) {
    this.setBaseURL(base || this.baseURL);
    this.url = new URL(url, this.baseURL).href;
  }

  static getComponentLength(type) {
    return {
      'SCALAR': 1,
      'VEC2': 2,
      'VEC3': 3,
      'VEC4': 4,
      'MAT2': 4,
      'MAT3': 9,
      'MAT4': 16
    }[type];
  }
  
  static getComponentByteSize(componentType) {
    return {
      5120: 1, // BYTE
      5121: 1, // UNSIGNED_BYTE
      5122: 2, // SHORT
      5123: 2, // UNSIGNED_SHORT
      5125: 4, // UNSIGNED_INT
      5126: 4  // FLOAT
    }[componentType];
  }
  
  static getTypedArray(componentType) {
    return {
      5120: Int8Array, // BYTE
      5121: Uint8Array, // UNSIGNED_BYTE
      5122: Int16Array, // SHORT
      5123: Uint16Array, // UNSIGNED_SHORT
      5125: Uint32Array, // UNSIGNED_INT
      5126: Float32Array  // FLOAT
    }[componentType];
  }
}

function sleep(t){
  return new Promise(resolve=>setTimeout(resolve,t));
}

class GLTFLoader extends GLTFCommon {

  static get Node() {
    return class Node {
      constructor(json) {
        // Default Properties
        this.camera = json.camera;
        this.children = json.children || [];
        this.skin = json.skin;
        this.matrix = json.matrix || Mat4.IdentityMatrix;
        this.mesh = json.mesh;
        this.rotation = json.rotation || [0, 0, 0, 1];
        this.scale = json.scale || [1, 1, 1];
        this.translation = json.translation || [0, 0, 0];
        this.weights = json.weights;
        this.name = json.name;

        // extra properties for loader
        this.parent = undefined;
      }
      traverse(fn) {
        fn(this); // preorder
        for (const node of this.children) {
          node.traverse(fn);
        }
      }
      get trs() {
        const m = [...Mat4.IdentityMatrix]; // deep copy
        m = Mat4.scale(m, this.scale[0], this.scale[1], this.scale[2]);
        m = Mat4.rotate(m, this.rotation[0], this.rotation[1], this.rotation[2], this.rotation[3]);
        m = Mat4.translate(m, this.translation[0], this.translation[1], this.translation[2]);
        return Mat4.multiplyMM(m, this.matrix);
      }
    };
  }

  // response(gltf: json)
  // progress(percent: int, message: string)
  // reject(message: string)
  async load(url, response, progress, reject) {
    const hasProgress = typeof progress === 'function';
    const hasResponse = typeof response === 'function';
    const hasReject = typeof reject === 'function';

    if (hasProgress) progress(0.0, 'load data from url');
    url = new URL(url, this.baseURL).href;
    this.json = await GLTFLoader.loadData(url, 'json');
    this.gltf = JSON.parse(JSON.stringify(this.json));
    if (!this.gltf) {
      if (hasReject) reject('Unsupported or Bad glTF file format');
      return undefined;
    }
    this.gltf.baseURL = new URL(url, location.href);
    console.log('get json', this.json);

    // const node = new GLTFLoader.Node();
    
    if (hasProgress) progress(0.1, 'reconstruct json');
    const self = this;
    const gl = this.gl;
    
    // nodes
    if (hasProgress) progress(0.1, 'reconstruct json (nodes)');
    this.gltf.nodes = await Promise.all(this.gltf.nodes.map((node) => {
      return new GLTFLoader.Node(node);
    }));
    for (const node of this.gltf.nodes) {
      console.log('Node:', node);
      node.children = await Promise.all(node.children.map((child) => {
        const target = self.gltf.nodes[child];
        target.parent = node;
        return target;
      }));
    }
    console.log('Nodes', this.gltf.nodes);

    // buffers
    if (hasProgress) progress(0.2, 'reconstruct json (buffers)');
    this.gltf.buffers = await Promise.all(this.gltf.buffers.map((buffer) => {
      const url = new URL(buffer.uri, self.gltf.baseURL.href);
      return GLTFLoader.loadData(url.href, 'arraybuffer');
    }));
    console.log('Buffer', this.gltf.buffers);
    
    // buffer views
    if (hasProgress) progress(0.3, 'reconstruct json (buffer views)');
    this.gltf.bufferViews = await Promise.all(this.gltf.bufferViews.map((bufferView) => {
      bufferView._view = new DataView(
        self.gltf.buffers[bufferView.buffer],
        bufferView.byteOffset,
        bufferView.byteLength
      );
      bufferView._count = bufferView.byteLength / (bufferView.byteStride || 1);
      return bufferView;
    }));
    console.log('Buffer View', this.gltf.bufferViews);

    // accessors
    if (hasProgress) progress(0.4, 'reconstruct json (accessors)');
    this.gltf.accessors = await Promise.all(this.gltf.accessors.map((accessor) => {
      const view = self.gltf.bufferViews[accessor.bufferView];
      const buffer = self.gltf.buffers[view.buffer];
      accessor.byteSize = GLTFCommon.getComponentLength(accessor.type);
      accessor.byteStride = view.byteStride || 0;
      const length = accessor.count * accessor.byteSize;
      const typedArray = GLTFCommon.getTypedArray(accessor.componentType);
      accessor.typedArray = new typedArray(buffer, view.byteOffset + (accessor.byteOffset || 0), length);
      accessor.glBuffer = GLTFLoader.createArrayBuffer(self.gl, accessor.typedArray);
      return accessor;
    }));
    console.log('Accessor', this.gltf.accessors);

    // textures
    if (hasProgress) progress(0.7, 'reconstruct json (textures)');
    if (this.gltf.textures) {
      this.gltf.textures = await Promise.all(this.gltf.textures.map((texture) => {
        let uri = null;
        if (texture.source !== undefined) {
          uri = self.gltf.images[texture.source].uri;
        }
        let sampler = null;
        if (texture.sampler !== undefined) {
          sampler = self.gltf.samplers[texture.sampler];
        }
        const url = new URL(uri, self.gltf.baseURL);
        texture.glTexture = GLTFLoader.createTexture(gl, url.href, sampler);
        return texture;
      }));
    }
    
    if (hasProgress) progress(0.9, 'precompleted');

    if (hasProgress) progress(1.0, 'completed');

    await sleep(200);
    if (hasResponse) response(this.gltf);
    return this.gltf;
  }
  
  static async loadData(url, dataType) {
    return new Promise((resolve, reject) => {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          try {
              resolve(xmlhttp.response);
          } catch(err) {
              console.log(err.message + " in " + xmlhttp.responseText);
              reject(err.message);
              return;
          }
        }
      };

      xmlhttp.open("GET", url, true);
      xmlhttp.responseType = dataType || '';
      xmlhttp.send();
    });
  }

  static createArrayBuffer(gl, array, target, usage) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(target || gl.ARRAY_BUFFER, buffer);
    gl.bufferData(target || gl.ARRAY_BUFFER, usage || array, gl.STATIC_DRAW);
    return buffer;
  }

  static createTexture(gl, url, sampler) {
    sampler = sampler || {};
  
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS || gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT || gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter || gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter || gl.LINEAR);
      // gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };
    image.src = url;
    console.log(image.src);
  
    return texture;
  };
}

class GLTFRenderer extends GLTFCommon {

  static get MeshRenderer() {
    return class MeshRenderer {
      constructor(mesh) {
        this.mesh = mesh;
      }
      draw() {
      }
    };
  }

  draw(gltf) {
    const node = gltf.nodes[0];
    console.log(node);
    const mesh = gltf.meshes[node.mesh];
    console.log(mesh);
    const primitive = mesh.primitives[0];
    const _normals = gltf.accessors[primitive.attributes.NORMAL];
    const _positions = gltf.accessors[primitive.attributes.POSITION];
    const _texcoords = gltf.accessors[primitive.attributes.TEXCOORD_0];
    const _indices = gltf.accessors[primitive.indices];
    const _material = gltf.materials[primitive.material];
    console.log('_material', _material);
    const _texture = gltf.textures[_material.pbrMetallicRoughness.baseColorTexture.index];
    console.log('_texture', _texture);

    const gl = this.gl;
    const canvas = gl.canvas;

    /////////////////////////////////////////////////////////////////////////////////////
    // Create and store data into index buffer
    var indexBuffer = GLTFLoader.createArrayBuffer(gl, _indices.typedArray, gl.ELEMENT_ARRAY_BUFFER);

    /*=================== Shaders =========================*/

    var vertCode = document.getElementById('vertex-shader').innerText;
    var fragCode = document.getElementById('fragment-shader').innerText;

    var shaderProgram = GLTFRenderer.createProgram(gl, vertCode, fragCode);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    /* ====== Associating attributes to vertex shader =====*/
    var Pmatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    var Vmatrix = gl.getUniformLocation(shaderProgram, "uViewMatrix");
    var Mmatrix = gl.getUniformLocation(shaderProgram, "uModelMatrix");
    // var Nmatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    
    {
      // Texture
      var sampler = gl.getUniformLocation(shaderProgram, "uSampler");
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, _texture.glTexture);
      gl.uniform1i(sampler, 0);
    }

    {
      // Position
      const index = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      const size = _positions.byteSize;
      const type = _positions.componentType;
      const normalized = _positions.normalized || false;
      const stride = _positions.byteStride || 0;
      const offset = _positions.offset || 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, _positions.glBuffer);
      gl.vertexAttribPointer(index, size, type, normalized, 0, 0);
      gl.enableVertexAttribArray(index);
    }

    {
      // console.log('normals', _normals);
      // // Normal
      // const index = gl.getAttribLocation(shaderProgram, "aVertexNormal");
      // const size = _normals.byteSize;
      // const type = _normals.componentType;
      // const normalized = _normals.normalized || false;
      // const stride = _normals.byteStride || 0;
      // const offset = _normals.offset || 0;
      // gl.bindBuffer(gl.ARRAY_BUFFER, _normals.glBuffer);
      // gl.bufferData(gl.ARRAY_BUFFER, _normals.typedArray, gl.STATIC_DRAW);
      // gl.vertexAttribPointer(index, size, type, normalized, 0, 0);
      // gl.enableVertexAttribArray(index);
    }
      
    {
      // Texture coords
      const index = gl.getAttribLocation(shaderProgram, "aTextureCoord");
      const size = _texcoords.byteSize;
      const type = _texcoords.componentType;
      const normalized = _texcoords.normalized || false;
      const stride = _texcoords.byteStride || 0;
      const offset = _texcoords.offset || 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, _texcoords.glBuffer);
      gl.vertexAttribPointer(index, size, type, normalized, 0, 0);
      gl.enableVertexAttribArray(index);
    }

    /*==================== MATRIX =====================*/

    function get_projection(angle, a, zMin, zMax) {
      var ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
      return [
          0.5/ang, 0 , 0, 0,
          0, 0.5*a/ang, 0, 0,
          0, 0, -(zMax+zMin)/(zMax-zMin), -1,
          0, 0, (-2*zMax*zMin)/(zMax-zMin), 0 
      ];
    }

    var projMatrix = get_projection(40, canvas.width/canvas.height, 1, 100);
    var modelMatrix = Mat4.IdentityMatrix;
    var viewMatrix = Mat4.IdentityMatrix;

    viewMatrix = Mat4.translate(viewMatrix, 0, 0, -6);
    modelMatrix = Mat4.scale(modelMatrix, 50, 50, 50);

    /*================= Drawing ===========================*/
    var time_old = 0;

    var animate = function(time) {

      var dt = time - time_old;
      Mat4.rotateZ(modelMatrix, dt * 0.0001);
      Mat4.rotateY(modelMatrix, dt * 0.0005);
      Mat4.rotateX(modelMatrix, dt * 0.0003);
      time_old = time;
      
      // const normalMatrix = Mat4.transpose(Mat4.inverse(Mat4.multiplyMM(viewMatrix, modelMatrix)));
      // gl.uniformMatrix4fv(Nmatrix, false, normalMatrix);

      gl.viewport(0.0, 0.0, canvas.width, canvas.height);
      GLTFRenderer.clear(gl);

      gl.uniformMatrix4fv(Pmatrix, false, projMatrix);
      gl.uniformMatrix4fv(Vmatrix, false, viewMatrix);
      gl.uniformMatrix4fv(Mmatrix, false, modelMatrix);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(primitive.mode || gl.TRIANGLES, _indices.count, gl.UNSIGNED_SHORT, 0);

      window.requestAnimationFrame(animate);
    }
    animate(0);
  }

  static clear(gl) {
    gl.clearDepth(1.0);                 // Clear everything
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  static createShader(gl, shaderCode, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    const message = gl.getShaderInfoLog(shader);
    if (message.length > 0) throw message;
    return shader;
  }

  static createProgram(gl, vShaderCode, fShaderCode) {
    const vs = this.createShader(gl, vShaderCode, gl.VERTEX_SHADER);
    const fs = this.createShader(gl, fShaderCode, gl.FRAGMENT_SHADER);
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    return program;
  }
}

//
// main
// all classes(functions) define as well
//
(function(){
  const KhronosURL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');

  const loadingBar = document.getElementById('loading-bar');
  const loadingContainer = loadingBar.parentNode;
  const dropdown = document.getElementById('gltf-samples');

  function onResize() {
    loadingContainer.style.height = canvas.clientHeight + 'px';
  }

  window.addEventListener('resize', onResize);

  function onReady() {
    loadingContainer.classList.add('active');
    dropdown.setAttribute('disabled', true);
  }

  function onLoaded() {
    loadingContainer.classList.remove('active');
    dropdown.removeAttribute('disabled');
  }

  function onProcess(percentage, message) {
    console.info((100 * percentage) + '%', message);
    loadingBar.querySelector('.bar').style.width = (100 * percentage) + '%';
    loadingBar.querySelector('.message').innerText = message || 'Loading...';
  }

  onResize();

  const renderer = new GLTFRenderer(gl);
  // const vsSource = document.getElementById('vertex-shader').innerText;
  // const fsSource = document.getElementById('fragment-shader').innerText;
  const loader = new GLTFLoader(gl);
  loader.setBaseURL(KhronosURL);

  // loadAndDrawGLTF('BoxTextured/glTF/BoxTextured.gltf');
  loadAndDrawGLTF('Avocado/glTF/Avocado.gltf');

  function loadAndDrawGLTF(url) {
    onReady();
    loader.load(url, (gltf) => {
      onLoaded();
      console.log(gltf);
      renderer.draw(gltf);
    }, onProcess, console.error);
  }

  // attach HTML events
  dropdown.addEventListener('change', (evt) => {
    const opts = evt.target.options;
    const idx = evt.target.selectedIndex;
    const url = opts[idx].value;
    if (url) {
      console.log(url);
      loadAndDrawGLTF(url);
    }
  });
})();
