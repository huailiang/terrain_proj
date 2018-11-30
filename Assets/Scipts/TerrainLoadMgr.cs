using System.IO;
using UnityEngine;
using System.Collections.Generic;
using UnityEngine.SceneManagement;
using System.Collections;
using System;

public class TerrainLoadMgr
{
    private static TerrainLoadMgr _s = null;

    public static TerrainLoadMgr sington { get { if (_s == null) _s = new TerrainLoadMgr(); return _s; } }

    private Transform terrain_root;

    private Transform collider_root;

    private Transform parts_root;

    private TerrainPart[] parts;

    private string terrain_name;

    private XTerrainInfo terrain_info;

    private DyncRenderInfo[] render_lm_info;

    private TerrainInfo[] terrain_lm_info;

    private Dictionary<int, Terrain> map;

    private TerrainNode[] bxs;

    XLightmapData _lightmap_data;

    XLightmapData lightmap_data
    {
        get
        {
            if (_lightmap_data == null)
            {
                _lightmap_data = GameObject.FindObjectOfType<XLightmapData>();
            }
            return _lightmap_data;
        }
    }

    public Transform PartRoot
    {
        get { return parts_root; }
    }

    public void SetRoot(Transform terrain, Transform collider, string name)
    {
        terrain_root = terrain;
        collider_root = collider;
        parts_root = GameObject.Find("runtime_parts").transform;
        terrain_name = name;

        string path = "Assets/Resources/" + name + "/" + name;
        terrain_info = LoadTerrainInfo(path + ".bytes");
        
        if (map == null)
        {
            map = new Dictionary<int, Terrain>();
        }
        else
        {
            map.Clear();
        }
        bxs = collider_root.GetComponentsInChildren<TerrainNode>();
    }

    public void ResetRootPos()
    {
        if (terrain_root != null)
        {
            terrain_root.position = terrain_info.pos;
            terrain_root.localScale = Vector3.one;
        }
        if (collider_root != null)
        {
            collider_root.position = terrain_info.pos;
            collider_root.localScale = Vector3.one;
        }
    }

    public XTerrainInfo LoadTerrainInfo(string path)
    {
        FileStream fs = new FileStream(path, FileMode.OpenOrCreate, FileAccess.Read);
        BinaryReader reader = new BinaryReader(fs);
        XTerrainInfo info = new XTerrainInfo();
        try
        {
            float x = reader.ReadSingle();
            float y = reader.ReadSingle();
            float z = reader.ReadSingle();
            info.pos = new Vector3(x, y, z);
            info.sliceSize = reader.ReadInt32();
            info.treeDistance = reader.ReadSingle();
            info.treeBillboardDistance = reader.ReadSingle();
            info.treeCrossFadeLength = reader.ReadInt32();
            info.treeMaximumFullLODCount = reader.ReadInt32();
            info.detailObjectDistance = reader.ReadSingle();
            info.detailObjectDensity = reader.ReadSingle();
            info.heightmapPixelError = reader.ReadSingle();
            info.heightmapMaximumLOD = reader.ReadInt32();
            info.basemapDistance = reader.ReadSingle();
            info.lightmapIndex = reader.ReadInt32();
            info.castShadows = reader.ReadBoolean();
            LoadPartsInfo(reader);
        }
        catch (Exception e)
        {
            Debug.LogError(e.Message + " \n" + e.StackTrace);
        }
        finally
        {
            reader.Close();
            fs.Close();
        }
        return info;
    }

    private void LoadPartsInfo(BinaryReader reader)
    {
        int cnt = reader.ReadInt32();
        parts = new TerrainPart[cnt];
        Debug.Log(cnt);
        for (int i = 0; i < cnt; i++)
        {
            parts[i] = new TerrainPart();

            float x = reader.ReadSingle();
            float y = reader.ReadSingle();
            float z = reader.ReadSingle();
            parts[i].pos = new Vector3(x, y, z);
            x = reader.ReadSingle();
            y = reader.ReadSingle();
            z = reader.ReadSingle();
            parts[i].rot = Quaternion.Euler(x, y, z);
            x = reader.ReadSingle();
            y = reader.ReadSingle();
            z = reader.ReadSingle();
            parts[i].scale = new Vector3(x, y, z);
            parts[i].lightmapIndex = reader.ReadInt32();
            x = reader.ReadSingle();
            y = reader.ReadSingle();
            z = reader.ReadSingle();
            float w = reader.ReadSingle();
            parts[i].lightmapOffsetScale = new Vector4(x, y, z, w);
            parts[i].path = reader.ReadString();
        }
    }


    public void LoadItem(int xx, int yy)
    {
        GameObject go = new GameObject(string.Format("{2}_{0}_{1}", yy, xx, terrain_name));
        string path = terrain_name + "/" + terrain_name;
        go.transform.SetParent(terrain_root);
        go.transform.localPosition = new Vector3(xx * terrain_info.sliceSize, 0, yy * terrain_info.sliceSize);
        Terrain terrain = go.AddComponent<Terrain>();
        terrain.terrainData = Resources.Load<TerrainData>(string.Format(path + "_{0}_{1}", yy, xx));
        var collider = go.AddComponent<TerrainCollider>();
        collider.terrainData = terrain.terrainData;

        terrain.reflectionProbeUsage = UnityEngine.Rendering.ReflectionProbeUsage.Off;
        terrain.treeDistance = terrain_info.treeDistance;
        terrain.treeBillboardDistance = terrain_info.treeBillboardDistance;
        terrain.treeCrossFadeLength = terrain_info.treeCrossFadeLength;
        terrain.treeMaximumFullLODCount = terrain_info.treeMaximumFullLODCount;
        terrain.detailObjectDistance = terrain_info.detailObjectDistance;
        terrain.detailObjectDensity = terrain_info.detailObjectDensity;
        terrain.heightmapPixelError = terrain_info.heightmapPixelError;
        terrain.heightmapMaximumLOD = terrain_info.heightmapMaximumLOD;
        terrain.basemapDistance = terrain_info.basemapDistance;
        terrain.castShadows = terrain_info.castShadows;
        terrain.gameObject.isStatic = true; 

        if (terrain_lm_info != null)
        {
            int index = 4 * xx + yy;
            terrain.lightmapIndex = terrain_lm_info[index].lightmapIndex;
            terrain.lightmapScaleOffset = terrain_lm_info[index].lightmapOffsetScale;
        }
        else
        {
            terrain.lightmapIndex = terrain_info.lightmapIndex;
        }
        int key = (yy << 4) + xx;
        if (!map.ContainsKey(key))
        {
            map.Add(key, terrain);
        }

        LoadPart(xx, yy);
    }

    public void LoadCollider(int xx, int yy)
    {
        GameObject go = new GameObject(string.Format("box_{0}_{1}", yy, xx));
        go.transform.SetParent(collider_root);
        go.transform.position = new Vector3(xx * terrain_info.sliceSize, 0, yy * terrain_info.sliceSize);
        var bx = go.AddComponent<BoxCollider>();
        bx.isTrigger = true;
        bx.center = new Vector3(80, 0, 80);
        bx.size = new Vector3(400, 100, 400);
        bx.enabled = false;
        var node = go.AddComponent<TerrainNode>();
        node.y = yy;
        node.x = xx;
        node.box = bx;
    }


    public void EnableBox(bool enabled)
    {
        int cnt = bxs.Length;
        for (int i = 0; i < cnt; i++)
        {
            bxs[i].box.enabled = enabled;
        }
    }

    public void UnloadAll()
    {
        if (map != null)
        {
            foreach (var item in map)
            {
                int y = item.Key >> 4;
                int x = item.Key & 0xf;
                UnloadItem(x, y);
            }
            map.Clear();
        }
        if (terrain_root != null)
        {
            GameObject.Destroy(terrain_root.gameObject);
        }
        if (collider_root != null)
        {
            GameObject.Destroy(collider_root.gameObject);
        }
    }

    public bool UnloadItem(int xx, int yy)
    {
        int key = (yy << 4) + xx;
        UnloadPart(xx, yy);
        return Unload(key);
    }


    private bool Unload(int indx)
    {
        if (map.ContainsKey(indx))
        {
            if (map[indx] != null)
            {
                Terrain.Destroy(map[indx], 0.4f);
                GameObject.Destroy(map[indx].gameObject, 0.4f);
            }
            map.Remove(indx);
            return true;
        }
        return false;
    }

    private void LoadPart(int xx, int yy)
    {
        Bounds bounds = new Bounds();
        Vector3 pos = new Vector3((xx + 0.5f) * terrain_info.sliceSize, 0, (yy + 0.5f) * terrain_info.sliceSize);
        bounds.center = terrain_info.pos + pos;
        bounds.size = terrain_info.sliceSize * Vector3.one;
        for (int i = 0; i < parts.Length; i++)
        {
            if (parts[i].InRange(bounds))
            {
                parts[i].Load();
            }
        }
    }

   
    private void UnloadPart(int xx, int yy)
    {
        Bounds bounds = new Bounds();
        Vector3 pos = new Vector3((xx + 0.5f) * terrain_info.sliceSize, 0, (yy + 0.5f) * terrain_info.sliceSize);
        bounds.center = terrain_info.pos + pos;
        bounds.size = terrain_info.sliceSize * Vector3.one;

        for (int i = 0; i < parts.Length; i++)
        {
            if (parts[i].InRange(bounds))
            {
                parts[i].Unload();
            }
        }
    }

    public IEnumerator LoadLM(Action finish)
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
        }
        lightmap_data.SetUp();
        LightmapSettings.lightmaps = datas;
        LoadLightmapOffsetInfo(reader);

        reader.Close();
        ms.Close();
        www.Dispose();
        if (finish != null) finish();
    }

    private void LoadLightmapOffsetInfo(BinaryReader reader)
    {
        int cnt = reader.ReadInt32();
        render_lm_info = new DyncRenderInfo[cnt];
        for (int i = 0; i < cnt; i++)
        {
            DyncRenderInfo info = new DyncRenderInfo();
            info.lightIndex = reader.ReadInt32();
            float x = reader.ReadSingle();
            float y = reader.ReadSingle();
            float z = reader.ReadSingle();
            float w = reader.ReadSingle();
            info.lightOffsetScale = new Vector4(w, y, z, w);
            info.hash = reader.ReadInt32();
            x = reader.ReadSingle();
            y = reader.ReadSingle();
            z = reader.ReadSingle();
            info.pos = new Vector3(x, y, z);
            render_lm_info[i] = info;
        }
        cnt = reader.ReadInt32();
        terrain_lm_info = new TerrainInfo[cnt];
        for (int i = 0; i < cnt; i++)
        {
            TerrainInfo info = new TerrainInfo();
            info.lightmapIndex = reader.ReadInt32();
            float x = reader.ReadSingle();
            float y = reader.ReadSingle();
            float z = reader.ReadSingle();
            float w = reader.ReadSingle();
            info.lightmapOffsetScale = new Vector4(x, y, z, w);
            terrain_lm_info[i] = info;
        }
    }

}