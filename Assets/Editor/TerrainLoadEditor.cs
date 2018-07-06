using UnityEditor;
using UnityEngine;

public class TerrainLoadEditor : Editor
{

    [MenuItem("Terrain/Load")]
    private static void Load()
    {
        int XMax = 4, YMax = 4;
        Vector3 offset = Vector3.zero;
        Terrain terr = GameObject.FindObjectOfType<Terrain>();
        if (terr != null)
        {
            offset = terr.transform.position;
            terr.gameObject.SetActive(false);
        }

        string str_root_terrain = "terrain_root";
        string str_root_collider = "collider_root";
        string str_root_parts = "parts";

        GameObject root_terrain = GameObject.Find(str_root_terrain);
        GameObject root_collider = GameObject.Find(str_root_collider);
        GameObject root_part = GameObject.Find(str_root_parts);
        if (root_terrain == null) root_terrain = new GameObject(str_root_terrain);
        if (root_collider == null) root_collider = new GameObject(str_root_collider);

        TerrainLoadMgr.sington.SetRoot(root_terrain.transform, root_collider.transform, terr.name);

        for (int xx = 0; xx < XMax; ++xx)
        {
            for (int yy = 0; yy < YMax; ++yy)
            {
                TerrainLoadMgr.sington.LoadItem(xx, yy);
                TerrainLoadMgr.sington.LoadCollider(xx, yy);
            }
        }
        Debug.Log(root_part);
        //if (root_part != null) root_part.SetActive(false);
        TerrainLoadMgr.sington.ResetRootPos();
    }

}