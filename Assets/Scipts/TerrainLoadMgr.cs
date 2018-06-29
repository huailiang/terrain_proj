using System.IO;
using UnityEngine;
using System.Collections.Generic;

public class TerrainLoadMgr
{
    private static TerrainLoadMgr _s = null;

    public static TerrainLoadMgr sington { get { if (_s == null) _s = new TerrainLoadMgr(); return _s; } }

    private Transform terrain_root;

    private Transform collider_root;

    private Transform parts_root;

    private TerrainPart[] parts;

    private string terrain_name;

    private TerrainInfo terrain_info;

    private Dictionary<int, Terrain> map;

    private TerrainNode[] bxs;

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
            foreach (var item in map)
            {
                int y = item.Key >> 4;
                int x = item.Key & 0xf;
                UnloadItem(x, y);
            }
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

    public TerrainInfo LoadTerrainInfo(string path)
    {
        FileStream fs = new FileStream(path, FileMode.OpenOrCreate, FileAccess.Read);
        BinaryReader reader = new BinaryReader(fs);

        TerrainInfo info = new TerrainInfo();
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
        reader.Close();
        fs.Close();
        return info;
    }

    private void LoadPartsInfo(BinaryReader reader)
    {
        int cnt = reader.ReadInt32();
        parts = new TerrainPart[cnt];
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

        //terrain.treeDistance = info.treeDistance;
        //terrain.treeBillboardDistance = info.treeBillboardDistance;
        //terrain.treeCrossFadeLength = info.treeCrossFadeLength;
        //terrain.treeMaximumFullLODCount = info.treeMaximumFullLODCount;
        //terrain.detailObjectDistance = info.detailObjectDistance;
        //terrain.detailObjectDensity = info.detailObjectDensity;
        //terrain.heightmapPixelError = info.heightmapPixelError;
        //terrain.heightmapMaximumLOD = info.heightmapMaximumLOD;
        //terrain.basemapDistance = info.basemapDistance;
        //terrain.lightmapIndex = info.lightmapIndex;
        //terrain.castShadows = info.castShadows;

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
            Terrain.Destroy(map[indx], 0.4f);
            GameObject.Destroy(map[indx].gameObject, 0.4f);
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

}