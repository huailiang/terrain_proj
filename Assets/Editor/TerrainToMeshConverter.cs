using UnityEditor;
using UnityEngine;

public class TerrainToMeshConverter : ScriptableObject
{

    [MenuItem("Terrain/Convert terrain to mesh")]
    static void Init()
    {
        if (Selection.objects.Length <= 0)
        {
            Debug.Log("Selection.objects.Length <= 0");
            return;
        }

        var terrainObj = Selection.objects[0] as GameObject;
        if (terrainObj == null)
        {
            Debug.Log("terrainObj == null");
            return;
        }

        var terrain = terrainObj.GetComponent<Terrain>();
        if (terrain == null)
        {
            Debug.Log("terrain == null");
            return;
        }
        var terrainData = terrain.terrainData;
        if (terrainData == null)
        {
            Debug.Log("terrainData == null");
            return;
        }

        int vertexCountScale = 4;
        int w = terrainData.heightmapWidth;
        int h = terrainData.heightmapHeight;
        Vector3 size = terrainData.size;
        float[,,] alphaMapData = terrainData.GetAlphamaps(0, 0, terrainData.alphamapWidth, terrainData.alphamapHeight);
        Vector3 meshScale = new Vector3(size.x / (w - 1f) * vertexCountScale, 1, size.z / (h - 1f) * vertexCountScale);
        Vector2 uvScale = new Vector2(1f / (w - 1f), 1f / (h - 1f)) * vertexCountScale * (size.x / terrainData.splatPrototypes[0].tileSize.x);     // [dev] 此处有问题，若每个图片大小不一，则出问题。日后改善

        w = (w - 1) / vertexCountScale + 1;
        h = (h - 1) / vertexCountScale + 1;
        Vector3[] vertices = new Vector3[w * h];
        Vector2[] uvs = new Vector2[w * h];
        Vector4[] alphasWeight = new Vector4[w * h];

        for (int i = 0; i < w; i++)
        {
            for (int j = 0; j < h; j++)
            {
                int index = j * w + i;
                float z = terrainData.GetHeight(i * vertexCountScale, j * vertexCountScale);
                vertices[index] = Vector3.Scale(new Vector3(i, z, j), meshScale);
                uvs[index] = Vector2.Scale(new Vector2(i, j), uvScale);

                // alpha map
                int i2 = (int)(i * terrainData.alphamapWidth / (w - 1f));
                int j2 = (int)(j * terrainData.alphamapHeight / (h - 1f));
                i2 = Mathf.Min(terrainData.alphamapWidth - 1, i2);
                j2 = Mathf.Min(terrainData.alphamapHeight - 1, j2);
                var alpha0 = alphaMapData[j2, i2, 0];
                var alpha1 = alphaMapData[j2, i2, 1];
                var alpha2 = alphaMapData[j2, i2, 2];
                var alpha3 = alphaMapData[j2, i2, 3];
                alphasWeight[index] = new Vector4(alpha0, alpha1, alpha2, alpha3);
            }
        }

        /*
        * 三角形
        *     b       c
        *      *******
        *      *   * *
        *      * *   *
        *      *******
        *     a       d
        */
        int[] triangles = new int[(w - 1) * (h - 1) * 6];
        int triangleIndex = 0;
        for (int i = 0; i < w - 1; i++)
        {
            for (int j = 0; j < h - 1; j++)
            {
                int a = j * w + i;
                int b = (j + 1) * w + i;
                int c = (j + 1) * w + i + 1;
                int d = j * w + i + 1;

                triangles[triangleIndex++] = a;
                triangles[triangleIndex++] = b;
                triangles[triangleIndex++] = c;

                triangles[triangleIndex++] = a;
                triangles[triangleIndex++] = c;
                triangles[triangleIndex++] = d;
            }
        }

        Mesh mesh = new Mesh();
        mesh.vertices = vertices;
        mesh.uv = uvs;
        mesh.triangles = triangles;
        mesh.tangents = alphasWeight;       // 将地形纹理的比重写入到切线中

        string transName = "[dev]MeshFromTerrainData";
        var t = terrainObj.transform.parent.Find(transName);
        if (t == null)
        {
            GameObject go = new GameObject(transName, typeof(MeshFilter), typeof(MeshRenderer), typeof(MeshCollider));
            t = go.transform;
        }

        // 地形渲染
        MeshRenderer mr = t.GetComponent<MeshRenderer>();
        Material mat = mr.sharedMaterial;
        if (!mat)
            mat = new Material(Shader.Find("Custom/Environment/TerrainSimple"));

        for (int i = 0; i < terrainData.splatPrototypes.Length; i++)
        {
            var sp = terrainData.splatPrototypes[i];
            mat.SetTexture("_Texture" + i, sp.texture);
        }

        t.parent = terrainObj.transform.parent;
        t.position = terrainObj.transform.position;
        t.gameObject.layer = terrainObj.layer;
        t.GetComponent<MeshFilter>().sharedMesh = mesh;
        t.GetComponent<MeshCollider>().sharedMesh = mesh;
        mr.sharedMaterial = mat;

        t.gameObject.SetActive(true);
        terrainObj.SetActive(false);

        Debug.Log("Convert terrain to mesh finished!");
    }

}
