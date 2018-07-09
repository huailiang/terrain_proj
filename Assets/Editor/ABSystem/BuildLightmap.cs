using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

public class BuildLightmap
{

    [MenuItem("Build/测试Lightmapping信息 ")]
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
            }
        }
    }

    [MenuItem("Build/生成LightmapData资源")]
    static void TestLightmapData()
    {
        try
        {
            string scene = SceneManager.GetActiveScene().name;
            string asset_path = "Assets/" + scene+".bytes";
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
    
}