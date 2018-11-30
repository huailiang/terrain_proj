using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

public class BuildLightmap
{

    [MenuItem("Terrain/测试Lightmapping信息 ")]
    static void TestLightmapingInfo()
    {
        GameObject[] tempObject;
        if (Selection.activeGameObject)
        {
            tempObject = Selection.gameObjects;
            for (int i = 0; i < tempObject.Length; i++)
            {
                Debug.Log("Object name: " + tempObject[i].name);
                Renderer render = tempObject[i].GetComponent<Renderer>();
                if (render != null)
                {
                    Debug.Log("Lightmaping Index:" + render.lightmapIndex);
                    Debug.Log("LightmapingOffset: " + render.lightmapScaleOffset);
                }
                Terrain terrain = tempObject[i].GetComponent<Terrain>();
                if (terrain != null)
                {
                    Debug.Log("lightmaping index:" + terrain.lightmapIndex);
                    Debug.Log("lightmaping offset: " + terrain.lightmapScaleOffset);
                }
            }
        }
    }

    [MenuItem("Terrain/生成LightmapData资源")]
    static void TestLightmapData()
    {
        try
        {
            string scene = SceneManager.GetActiveScene().name;
            string asset_path = "Assets/" + scene + ".bytes";
            string record = Path.Combine(Application.dataPath, scene + ".bytes");
            List<string> assetNames = new List<string>();
            assetNames.Add(asset_path);
            EditorUtility.DisplayProgressBar("build lightmap", "正在生成lightmap相关配置", 0.1f);
            FileStream fs = new FileStream(record, FileMode.OpenOrCreate, FileAccess.Write);
            BinaryWriter writer = new BinaryWriter(fs);
            int cnt = LightmapSettings.lightmaps.Length;
            Debug.Log("map cnt: " + cnt);
            writer.Write(cnt);
            Texture2D[] lmColors = new Texture2D[cnt];
            Texture2D[] lmDirs = new Texture2D[cnt];
            for (int i = 0; i < cnt; i++)
            {
                lmColors[i] = LightmapSettings.lightmaps[i].lightmapColor;
                lmDirs[i] = LightmapSettings.lightmaps[i].lightmapDir;
                writer.Write(lmColors[i] == null ? "" : lmColors[i].name);
                writer.Write(lmDirs[i] == null ? "" : lmDirs[i].name);
                if (lmColors[i] != null) assetNames.Add(AssetDatabase.GetAssetPath(lmColors[i]));
                if (lmDirs[i] != null) assetNames.Add(AssetDatabase.GetAssetPath(lmDirs[i]));
            }
            RecordLightmapOffset(writer);
            writer.Flush();
            writer.Close();
            fs.Close();
            AssetDatabase.ImportAsset(asset_path);

            string exportTargetPath = Application.dataPath + "/StreamingAssets/";
            Debug.Log(exportTargetPath);
            if (!Directory.Exists(exportTargetPath))
            {
                Directory.CreateDirectory(exportTargetPath);
            }
            EditorUtility.DisplayProgressBar("build lightmap", "正在生成lightmap assetbundle", 0.4f);
            List<AssetBundleBuild> list = new List<AssetBundleBuild>();
            AssetBundleBuild build = new AssetBundleBuild();
            build.assetBundleName = scene + "_lightmap.ab";
            build.assetNames = assetNames.ToArray();
            list.Add(build);
            BuildPipeline.BuildAssetBundles(exportTargetPath, list.ToArray(), BuildAssetBundleOptions.UncompressedAssetBundle, EditorUserBuildSettings.activeBuildTarget);
            EditorUtility.DisplayProgressBar("build lightmap", "正在生成lightmap assetbundle", 0.9f);
            string orig = Path.Combine(Application.dataPath, "Scenes/" + scene);
            string dest = Path.Combine(Directory.GetParent(Application.dataPath).FullName, "Lightmap/" + scene);
            if (Directory.Exists(dest)) Directory.Delete(dest, true);
            Directory.Move(orig, dest);
            AssetDatabase.DeleteAsset(asset_path);
        }
        catch (System.Exception e)
        {
            EditorUtility.DisplayDialog("error", e.Message, "ok");
            Debug.LogError(e.StackTrace);
        }
        finally
        {
            EditorUtility.ClearProgressBar();
            AssetDatabase.Refresh();
        }
    }

    private static void RecordLightmapOffset(BinaryWriter writer)
    {
        GameObject go = GameObject.Find("raceTrackLakeLevel");
        if (go != null)
        {
            var renderers = go.GetComponentsInChildren<MeshRenderer>();
            List<DyncRenderInfo> list = new List<DyncRenderInfo>();
            foreach (MeshRenderer r in renderers)
            {
                if (r.lightmapIndex != -1)
                {
                    DyncRenderInfo info = new DyncRenderInfo();
                    info.lightIndex = r.lightmapIndex;
                    info.lightOffsetScale = r.lightmapScaleOffset;
                    Object parentObject = PrefabUtility.GetCorrespondingObjectFromSource(r.gameObject);
                    info.hash = AssetDatabase.GetAssetPath(parentObject).GetHashCode();
                    info.pos = r.transform.position;
                    list.Add(info);
                    Debug.Log("path: " + info.hash);
                }
            }
            writer.Write(list.Count);
            for (int i = 0; i < list.Count; i++)
            {
                DyncRenderInfo info = list[i];
                writer.Write(info.lightIndex);
                writer.Write(info.lightOffsetScale.x);
                writer.Write(info.lightOffsetScale.y);
                writer.Write(info.lightOffsetScale.z);
                writer.Write(info.lightOffsetScale.w);
                writer.Write(info.hash);
                writer.Write(info.pos.x);
                writer.Write(info.pos.y);
                writer.Write(info.pos.z);
            }

            var terrains = go.GetComponentsInChildren<Terrain>();
            if (terrains != null)
            {
                int cnt = terrains.Length;
                writer.Write(cnt);
                for (int i = 0; i < cnt; i++)
                {
                    writer.Write(terrains[i].lightmapIndex);
                    writer.Write(terrains[i].lightmapScaleOffset.x);
                    writer.Write(terrains[i].lightmapScaleOffset.y);
                    writer.Write(terrains[i].lightmapScaleOffset.z);
                    writer.Write(terrains[i].lightmapScaleOffset.w);
                }
            }
            else
            {
                EditorUtility.DisplayDialog("error", "not found terrain gameobject", "ok");
            }
        }
        else
        {
            EditorUtility.DisplayDialog("error", "not found scene root gameobject", "ok");
        }
    }

}