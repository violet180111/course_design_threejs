import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { Water } from 'three/examples/jsm/objects/Water';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import './main.less';

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

/**
 * @description 创建一个点光源对象
 * @param color 光的颜色 16进制
 * @param intensity 光照的强度 数值越大越强
 * @param distance 这个距离表示从光源到光照强度为0的位置
 */
// 太阳点光源
const pointLight = new THREE.PointLight(0xffffff, 0, 2000);
// 设置光质
// h - 0.0 和 1.0 之间的色调值
// s - 0.0 和 1.0 之间的饱和度值
// l - 0.0 和 1.0 之间的亮度值
pointLight.color.setHSL(0.995, 0.5, 0.9);
// 设置光源位置
pointLight.position.set(0, 45, -2000);
/**
 * @description 加载纹理贴图的一个类
 */
const textureLoader = new THREE.TextureLoader();
// 加载纹理 传入的参数为文件的URL或者路径
const textureFlare0 = textureLoader.load('/images/lensflare0.png');
const textureFlare1 = textureLoader.load('/images/lensflare1.png');
/**
 * @description 创建一个模拟追踪着灯光的镜头光晕
 */
const lensflare = new Lensflare();
/**
 * @description 光晕的效果都是通过一个个LensflareElement对象组成的
 * @param texture 纹理贴图
 * @param size 光晕尺寸
 * @param distance 光源的距离值，范围是0到1
 * @param color 光晕的颜色
 */
lensflare.addElement(new LensflareElement(textureFlare0, 600, 0, pointLight.color));
lensflare.addElement(new LensflareElement(textureFlare1, 60, 0.6));
lensflare.addElement(new LensflareElement(textureFlare1, 70, 0.7));
lensflare.addElement(new LensflareElement(textureFlare1, 120, 0.9));
lensflare.addElement(new LensflareElement(textureFlare1, 70, 1));
// 向点光源中添加镜头光晕
pointLight.add(lensflare);
// 将点光源添加到场景中
scene.add(pointLight);

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
  waterNormals: new THREE.TextureLoader().load('/images/waternormals.jpg', texture => {
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
sky.material.uniforms['sunPosition'].value.copy(sun);
// 创建水面折射效果
water.material.uniforms['sunDirection'].value.copy(sun).normalize();
// 把创建好的天空当作场景的环境
// @ts-ignore
scene.environment = pmremGenerator.fromScene(sky).texture;

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
loader.load('/images/island.glb', mesh => {
  // 加载完成触发回调
  // 拿到模型实例对象
  islandMesh = mesh;

  // 初始化3D模型对象位置和大小
  mesh.scene.position.set(0, 50, -300);
  mesh.scene.scale.set(5, 5, 5);

  // 将3D模型添加到场景中
  scene.add(mesh.scene);
});

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
