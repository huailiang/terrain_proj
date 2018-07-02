<p align="center">
	<a href="https://unity3d.com/cn/">
	    <img src="https://huailiang.github.io/img/unity.jpeg" width="200" height="100">
	</a>
	&nbsp; &nbsp; &nbsp; &nbsp; 
    <a href="https://huailiang.github.io/">
    	<img src="https://huailiang.github.io/img/avatar-Alex.jpg" width="120" height="100">
   	</a>
</p>



Unity 大地形研究 

1.  切割大地形
	
	打开 unity, 在菜单栏点击 Terrain->Slicing 即可以切割大地形，代码会自动遍历 Hirerachy 里的地形，切割4X4的16块，切割好的地形默认会存在 Resources 目录下，生成一个地形 gameobject 同名的文件夹。

	除了地形分片资源，这里还会生成地形和物件相关的数据信息，保存成二进制文件，保存在同一目录下。 

2.  分段加载地形和物件。

	点击 Terrain->Load 会加载分片地形， 并且根据地形分片生成一个对应的 collider.

	collider 的 triger 会触发地形的加载和卸载，实现过程类似于 Unreal引擎实现的Level Streaming Volume。

3. 部件的加载
	
	部件如场景里的石头这个物件，他的加载跟着地形分片一同加载、卸载。而不是以 player 为中心做四叉树来管理场景的加载卸载。