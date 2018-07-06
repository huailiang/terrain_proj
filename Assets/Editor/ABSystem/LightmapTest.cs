using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;


public class LightmapTest
{

    [MenuItem("Build/" + "测试Lightmapping信息 ")]
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

    [MenuItem("Build/" + "生成LightmapData资源")]
    static void TestLightmapData()
    {
        string target = "lake.bytes";
        string record = Path.Combine(Application.dataPath, target);
        List<string> assetNames = new List<string>();
        assetNames.Add("Assets/" + target);
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

        string exportTargetPath = Application.dataPath + "/StreamingAssets/";
        Debug.Log(exportTargetPath);
        if (!Directory.Exists(exportTargetPath))
        {
            Directory.CreateDirectory(exportTargetPath);
        }

        List<AssetBundleBuild> list = new List<AssetBundleBuild>();
        AssetBundleBuild build = new AssetBundleBuild();
        build.assetBundleName = "lake_lightmap.ab";
        build.assetNames = assetNames.ToArray();
        list.Add(build);
        BuildPipeline.BuildAssetBundles(exportTargetPath, list.ToArray(), BuildAssetBundleOptions.UncompressedAssetBundle, EditorUserBuildSettings.activeBuildTarget);
        AssetDatabase.Refresh();
    }
}