using System.Collections.Generic;
using UnityEngine;


[System.Serializable]
public struct RendererInfo
{
    public Renderer renderer;
    public int lightmapIndex;
    public Vector4 lightmapOffsetScale;
}

[System.Serializable]
public struct TerrainInfo
{
    public Vector4 lightmapOffsetScale;
    public int lightmapIndex;
}

public struct DyncRenderInfo
{
    public int lightIndex;
    public Vector4 lightOffsetScale;
    public int hash;
    public Vector3 pos;
}

//场景中的Fog信息
[System.Serializable]
public struct FogInfo
{
    public bool fog;
    public FogMode fogMode;
    public Color fogColor;
    public float fogStartDistance;
    public float fogEndDistance;
    public float fogDensity;
}

public class XLightmapData : MonoBehaviour
{
    public FogInfo fogInfo;
    public List<RendererInfo> m_RendererInfo;
    public LightmapsMode lightmapsMode;

    //地形的LightMap信息
    public Terrain[] terrains;
    public TerrainInfo[] terrainsRendererInfo;

    //设置光照信息
    [ContextMenu("Setup")]
    public void SetUp()
    {
        LoadLightmap();
        LightmapSettings.lightmapsMode = lightmapsMode;
        RenderSettings.fog = fogInfo.fog;
        RenderSettings.fogMode = fogInfo.fogMode;
        RenderSettings.fogColor = fogInfo.fogColor;
        RenderSettings.fogStartDistance = fogInfo.fogStartDistance;
        RenderSettings.fogEndDistance = fogInfo.fogEndDistance;
        RenderSettings.fogDensity = fogInfo.fogDensity;
    }

    //保存光照信息
    [ContextMenu("Save")]
    public void SaveLightmap()
    {
        fogInfo = new FogInfo();
        fogInfo.fog = RenderSettings.fog;
        fogInfo.fogMode = RenderSettings.fogMode;
        fogInfo.fogColor = RenderSettings.fogColor;
        fogInfo.fogStartDistance = RenderSettings.fogStartDistance;
        fogInfo.fogEndDistance = RenderSettings.fogEndDistance;

        m_RendererInfo = new List<RendererInfo>();
        var renderers = GetComponentsInChildren<MeshRenderer>();
        foreach (MeshRenderer r in renderers)
        {
            if (r.lightmapIndex != -1)
            {
                RendererInfo info = new RendererInfo();
                info.renderer = r;
                info.lightmapOffsetScale = r.lightmapScaleOffset;
                info.lightmapIndex = r.lightmapIndex;
                m_RendererInfo.Add(info);
            }
        }

        terrains = GetComponentsInChildren<Terrain>();
        if (terrains != null)
        {
            int cnt = terrains.Length;
            terrainsRendererInfo = new TerrainInfo[cnt];
            for (int i = 0; i < cnt; i++)
            {
                var terrainRenderer = new TerrainInfo();
                terrainRenderer.lightmapOffsetScale = terrains[i].lightmapScaleOffset;
                terrainRenderer.lightmapIndex = terrains[i].lightmapIndex;
                terrainsRendererInfo[i] = terrainRenderer;
            }
        }
        lightmapsMode = LightmapSettings.lightmapsMode;
    }

    private void LoadLightmap()
    {
        for (int i = 0; i < terrainsRendererInfo.Length; i++)
        {
            if (terrains[i] != null)
            {
                terrains[i].lightmapScaleOffset = terrainsRendererInfo[i].lightmapOffsetScale;
                terrains[i].lightmapIndex = terrainsRendererInfo[i].lightmapIndex;
                Debug.Log("lightmap scale: " + terrainsRendererInfo[i].lightmapOffsetScale+" index: " + terrainsRendererInfo[i].lightmapIndex);
            }
        }
        if (m_RendererInfo.Count > 0)
        {
            foreach (var item in m_RendererInfo)
            {
                item.renderer.lightmapIndex = item.lightmapIndex;
                item.renderer.lightmapScaleOffset = item.lightmapOffsetScale;
            }
        }
    }
}
