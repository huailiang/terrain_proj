using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameController : MonoBehaviour
{

    private XLightmapData lmData;

    private void Awake()
    {
        //GameObject go1 = GameObject.Find("terrain_root");
        //GameObject go2 = GameObject.Find("collider_root");
        //TerrainLoadMgr.sington.SetRoot(go1.transform, go2.transform, "LakeTerrain");
        //TerrainLoadMgr.sington.EnableBox(true);

        lmData = GameObject.FindObjectOfType<XLightmapData>();
    }


    private void OnGUI()
    {
        if(GUI.Button(new Rect(10,10,100,70),"LoadLightMap"))
        {
            StartCoroutine(LoadLM());
        }
    }

    private IEnumerator LoadLM()
    {
        string scene = SceneManager.GetActiveScene().name;
        string path = Path.Combine(Application.streamingAssetsPath, scene + "_lightmap.ab");
        WWW www = new WWW(path);
        yield return www;
        AssetBundle curBundleObj = www.assetBundle;
        TextAsset text = curBundleObj.LoadAsset<TextAsset>(scene);
        MemoryStream ms = new MemoryStream(text.bytes);
        ms.Position = 0;
        BinaryReader reader = new BinaryReader(ms);
        int cnt = reader.ReadInt32();
        string[] lmcolors = new string[cnt];
        string[] lmdirs = new string[cnt];
        LightmapData[] datas = new LightmapData[cnt];
        for (int i = 0; i < cnt; i++)
        {
            lmcolors[i] = reader.ReadString();
            lmdirs[i] = reader.ReadString();
            LightmapData data = new LightmapData();
            if (!string.IsNullOrEmpty(lmcolors[i]))
            {
                data.lightmapColor = curBundleObj.LoadAsset<Texture2D>(lmcolors[i]);
            }
            if (!string.IsNullOrEmpty(lmdirs[i]))
            {
                data.lightmapDir = curBundleObj.LoadAsset<Texture2D>(lmdirs[i]);
            }
            datas[i] = data;
            lmData.SetUp();
        }
        LightmapSettings.lightmaps = datas;
        reader.Close();
        ms.Close();
        www.Dispose();
    }
    

    private void Update()
    {
        AsynLoadMgr.sington.Update();
    }
}