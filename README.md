## 一、项目介绍

#### 一个基于 webgl(相当于能在浏览器上运行的 opengl)的课程设计 🏝️

### 环境准备

1. 安装[nodejs](https://nodejs.org/zh-cn/download/), 安装完成后在`cmd`下输入`node -v`，出现版本提示即为安装成功
2. 在文件根目录下打开终端窗口，运行`npm install`，等待安装成功
3. 安装成功继续执行`npm start`即可

也可跳过上述步骤直接查看代码效果 👇

✉️ 在线预览地址：https://course-design-threejs.vercel.app

### 使用说明

- 鼠标拖动进行旋转，便于切换到模型的各个视角
- 鼠标滚轮滚动进行缩放，更加清楚直观地查看模型细节

![image-20221004123810230.png](https://s2.loli.net/2022/10/04/mzyGjEDaVeBOg7u.png)

![image-20221004123754892.png](https://s2.loli.net/2022/10/04/7HS4qgnxzkWI2rO.png)

### 基础需求

**3D**渲染模型，提供基本的旋转和缩放操作以及光照、纹理效果，还有一些简单动画等

## 二、项目实现

- **技术选型**

  ```Plaintext
  编程语言：JavaScript
  开发框架：threejs(一个基于opengl的框架)
  语法扩展工具：TypeScript
  打包工具：vite
  代码格式化和校验规范工具：Prettier Eslint
  ```

- **文件结构（逻辑代码都在 src/main.ts 里面）**

  ```Plain
  ├── public 静态资源（图片，3D模型）此目录下所有文件会被 copy 到输出路径
  └── src
  	├── main.less 页面样式文件
  	├── main.ts 代码入口文件
      ├── vite-env.d.ts vite类型声明文件
  ├── .eslintrc.js 代码校验配置文件
  ├── .gitignore git提交忽略某些文件的配置文件
  ├── .prettierrc 代码格式化配置文件
  ├── index.html 页面入口文件
  ├── package.json 项目配置文件
  ├── README.md 项目简述文件
  ├── vite.config.ts vite配置文件
  ├── yarn.lock 保证第三包版本号一致的文件(yarn)
  ```

- **实现过程**

  具体的细节在代码中有注释介绍，这里就说一下大体思路

  - 👨‍🎨 素材准备

    课设用到的小岛 3D 模型是在 [sketchfab.com](https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount) 找的免费模型

  - 📦 资源引入

    首先，引入开发所需的必备资源，`OrbitControls` 用于镜头轨道控制；`GLTFLoader` 用于加载 `gltf` 格式模型；`Water` 是 `Three.js` 内置的一个类，可以生成类似水的效果；`Sky` 可以生成天空效果；还有水面，太阳的法向量贴图，小岛 3D 模型

  - 🌏 场景初始化

    ```js
    /**
     * @description 创建一个新的场景对象(场景就是能够让你在什么地方、摆放什么东西来交给three.js来渲染，这是你放置物体、灯光和摄像机的地方)
     */
    const scene = new THREE.Scene();
    /**
     * @description 创建一个新的摄像机对象(摄像机使用perspective projection（透视投影）来进行投影,投影模式被用来模拟人眼所看到的景象)
     * @param fov — 摄像机视锥体垂直视野角度
     * @param aspect — 摄像机视锥体长宽比
     * @param near — 摄像机视锥体近端面
     * @param far — 摄像机视锥体远端面
     */
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);

    // 设置摄像机的位置，传入的参数分别为x，y，z轴位置
    camera.position.set(0, 600, 1600);
    // 投影相机对象的.near和.far属性变化，需要手动更新相机对象的投影矩阵
    camera.updateProjectionMatrix();
    // 往场景里面添加一个相机
    scene.add(camera);

    // 创建一个webgl(基于opengl)渲染对象
    const renderer = new THREE.WebGLRenderer({
      // 设置抗锯齿属性
      antialias: true,
    });
    // 用于在普通计算机显示器或者移动设备屏幕等低动态范围介质上，模拟、逼近高动态范围（HDR）效果
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 将输出canvas的大小调整为(width, height)并考虑设备像素比，且将视口从(0, 0)开始调整到适合大小
    // canvas就是用于绘制3D图像的容器
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 监听窗口变化，重新调整摄像机视锥体长宽比，投影矩阵和canvas大小等
    window.onresize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    // 将绘制3D图像的容器添加到页面上
    document.body.appendChild(renderer.domElement);

    /**
     * @description 创建一个轨道控制器对象(轨道控制器可以使得相机围绕目标进行轨道运动)
     * @param camera — 摄像机对象
     * @param domElement — canvas元素(绘制3D图像的容器)
     */
    const controls = new OrbitControls(camera, renderer.domElement);
    // 更改控制器的焦点，传入的参数分别为x，y，z轴位置
    controls.target.set(0, 0, 0);
    // 启用惯，给控制器带来重量感
    controls.enableDamping = true;
    // 禁用摄像机平移
    controls.enablePan = false;
    // 能够垂直旋转的角度的上限, 默认值为Math.PI
    controls.maxPolarAngle = 1.5;
    // 能够将相机向内移动多少 就是能将场景放大多少
    controls.minDistance = 50;
    // 能够将相机向外移动多少 就是能将场景缩小多少
    controls.maxDistance = 2200;

    /**
     * @description 创建一个环境光对象(环境光会均匀的照亮场景中的所有物体)
     * @param 光的颜色 16进制
     * @param 光照的强度 数值越大越强
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    // 往场景里面添加一个环境光
    scene.add(ambientLight);

    /**
     * @description 创建一个平行光对象(平行光是沿着特定方向发射的光)
     * @param color 光的颜色 16进制
     * @param intensity 光照的强度 数值越大越强
     */
    const dirLight = new THREE.DirectionalLight(0xffffff, 0);
    // 设置光质
    // h - 0.0 和 1.0 之间的色调值
    // s - 0.0 和 1.0 之间的饱和度值
    // l - 0.0 和 1.0 之间的亮度值
    dirLight.color.setHSL(0.1, 1, 0.95);
    // 设置光照方向，假如这个值设置等于(0, 1, 0),那么光线将会从上往下照射
    dirLight.position.set(-1, 1.75, 1);
    // 将光照这个三维向量与所传入的标量s进行相乘，相当于将光照延长
    dirLight.position.multiplyScalar(30);
    // 往场景里面添加一个平行光
    scene.add(dirLight);
    ```

  - 🌌 天空

    ```js
    /**
     * @description 创建一个天空对象
     */
    const sky = new Sky();
    // 天空初始化是一个点，需要放大让其铺满场景
    sky.scale.setScalar(10000);
    // 将天空添加到场景中
    scene.add(sky);

    // 设置天空材质着色器
    const skyUniforms = sky.material.uniforms;
    // 设置天空浑浊度
    skyUniforms['turbidity'].value = 3;
    // 设置天空发光强度
    skyUniforms['rayleigh'].value = 10;
    // 设置天空散射系数
    skyUniforms['mieCoefficient'].value = 0.005;
    // 设置定向散射值
    skyUniforms['mieDirectionalG'].value = 0.8;
    ```

  - 🌊 海洋

    ```js
    /**
     * @description 创建一个圆形缓冲几何体对象
     * @param radius 圆形的半径
     * @param segments 分段（三角面）的数量
     */
    const waterGeometry = new THREE.CircleGeometry(10000, 128);
    /**
     * @description 创建一个水面对象 加载外部引入的纹理贴图 并且贴在上面构造出来的圆形几何体上
     * @param textureWidth 画布宽度
     * @param textureHeight 画布高度
     * @param waterNormals 法向量贴图
     * @param sunDirection 光照方向
     * @param sunColor 阳光颜色
     * @param waterColor 水颜色
     * @param distortionScale 物体倒影分散度
     * @param fog 雾
     */
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('/images/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });
    // 刚创建出来的圆形水面是竖着的，需要将其翻转过来
    water.rotateX(-Math.PI / 2);
    // 将水面添加到场景中
    scene.add(water);
    ```

  - ☀ 太阳

    ```js
    /**
     * @description 创建一个太阳对象(该类表示的是一个三维向量 一个位于三维空间中的点然后放大可以生成一个球体)
     */
    const sun = new THREE.Vector3();
    /**
     * @description 此类从 cubeMap 环境纹理生成预过滤的 Mipmapped Radiance Environment Map (PMREM) 根据材料粗糙度快速生成不同级别的模糊
     * @param renderer WebGL渲染器对象
     */
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    // 将角度单位从度数转换为弧度
    const phi = THREE.MathUtils.degToRad(88);
    const theta = THREE.MathUtils.degToRad(180);
    // 从球面坐标设置三维向量
    sun.setFromSphericalCoords(1, phi, theta);
    // 创建天空折射太阳效果
    sky.material.uniforms['sunPosition'].value.copy(sun);
    // 创建水面折射太阳效果
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();
    ```

  - 🏝️ 小岛

    ```js
    let islandMesh: GLTF | null = null;
    /**
     * @description 其功能是处理并跟踪已加载和待处理的数据
     */
    const manager = new THREE.LoadingManager();
    /**
     * @description 创建一个GLTF加载器对象
     */
    const loader = new GLTFLoader(manager);
    // 开始加载3D模型对象
    loader.load('/images/island.glb', (mesh) => {
      // 加载完成触发回调
      // 拿到模型实例对象
      islandMesh = mesh;

      // 初始化3D模型对象位置和大小
      mesh.scene.position.set(0, 50, -300);
      mesh.scene.scale.set(5, 5, 5);

      // 将3D模型添加到场景中
      scene.add(mesh.scene);
    });
    ```

  - 🚀 开始渲染

    ```js
    function render() {
      // 模拟小岛上浮下沉动画
      const islandY = Math.sin(Date.now() * 0.001) * 5 + 50;
      islandMesh && islandMesh.scene.position.set(0, islandY, -300);

      // 模拟水面流动动画
      water.material.uniforms['time'].value += 1.0 / 60.0;

      // 触发轨道控制器惯性效果
      controls.update();

      // 渲染场景
      renderer.render(scene, camera);

      // 重复执行渲染函数，使得动画持续执行
      requestAnimationFrame(render);
    }

    // 开始渲染
    render();
    ```
