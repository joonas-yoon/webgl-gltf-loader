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

  static getComponentsType(componentType) {
    return {
      'SCALAR': 1,
      'VEC2': 2,
      'VEC3': 3,
      'VEC4': 4,
      'MAT2': 4,
      'MAT3': 9,
      'MAT4': 16
    }[componentType];
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
        this.matrix = json.matrix;
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
    
    await sleep(500);
    if (hasProgress) progress(0.1, 'reconstruct json');
    const self = this;
    const gl = this.gl;
    
    // nodes
    await sleep(500);
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
    await sleep(500);
    if (hasProgress) progress(0.2, 'reconstruct json (buffers)');
    this.gltf.buffers = await Promise.all(this.gltf.buffers.map((buffer) => {
      const url = new URL(buffer.uri, self.gltf.baseURL.href);
      return GLTFLoader.loadData(url.href, 'arraybuffer');
    }));
    console.log('Buffer', this.gltf.buffers);
    
    // buffer views
    await sleep(500);
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
    await sleep(500);
    if (hasProgress) progress(0.4, 'reconstruct json (accessors)');
    this.gltf.accessors = await Promise.all(this.gltf.accessors.map((accessor) => {
      const view = self.gltf.bufferViews[accessor.bufferView];
      const buffer = self.gltf.buffers[view.buffer];
      const typedArray = GLTFCommon.getTypedArray(accessor.componentType);
      accessor.typedArray = new typedArray(buffer, view.byteOffset + (accessor.byteOffset || 0), accessor.count);
      accessor.glBuffer = GLTFLoader.createArrayBuffer(self.gl, accessor.typedArray);
      return accessor;
    }));
    console.log('Accessor', this.gltf.accessors);

    // textures
    await sleep(500);
    if (hasProgress) progress(0.7, 'reconstruct json (textures)');
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
    
    await sleep(500);
    if (hasProgress) progress(0.9, 'precompleted');

    await sleep(500);
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

  static createArrayBuffer(gl, array) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
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
    };
    image.src = url;
  
    return texture;
  };
}

class GLTFRenderer extends GLTFCommon {

  static get MeshRenderer() {
    return class MeshRenderer {
      constructor(mesh) {
        this.mesh = mesh;
      }
      draw(node, projection, view, sharedUniforms) {
        const {mesh} = this;
        gl.useProgram(meshProgramInfo.program);
        for (const primitive of mesh.primitives) {
          webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, primitive.bufferInfo);
          webglUtils.setUniforms(meshProgramInfo, {
            u_projection: projection,
            u_view: view,
            u_world: node.worldMatrix,
          });
          webglUtils.setUniforms(meshProgramInfo, primitive.material.uniforms);
          webglUtils.setUniforms(meshProgramInfo, sharedUniforms);
          webglUtils.drawBufferInfo(gl, primitive.bufferInfo);
        }
      }
    };
  }

  drawScene(programInfo) {
    const gl = this.gl;
    
    gl.clearDepth(1.0);                 // Clear everything
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const canvas = document.getElementById('glcanvas');
    
    /*======= Defining and storing the geometry ======*/
    var vertices = [-0.7,-0.1,0, -0.3,0.6,0, -0.3,-0.3,0, 0.2,0.6,0, 0.3,-0.3,0, 0.7,0.6,0];
   
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    /*=================== Shaders ====================*/
    var vertCode =
      'attribute vec3 coordinates;' +
      'void main(void) {' +
          ' gl_Position = vec4(coordinates, 1.0);' +
      '}';

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);
    
    var fragCode =
      'void main(void) {' +
          'gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);' +
      '}';

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);
    
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    /*======= Associating shaders to buffer objects ======*/
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    /*============ Drawing the triangle =============*/
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.LINES, 0, 6);
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

  loadAndDrawGLTF('BoxTextured/glTF/BoxTextured.gltf');

  function loadAndDrawGLTF(url) {
    onReady();
    loader.load(url, (gltf) => {
      onLoaded();
      renderer.drawScene();
      console.log(gltf);
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
