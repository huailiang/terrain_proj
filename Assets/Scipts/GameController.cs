using UnityEngine;

public class GameController : MonoBehaviour
{

    private void OnGUI()
    {
        if (GUI.Button(new Rect(10, 10, 100, 70), "LoadLightMap"))
        {
            StartCoroutine(TerrainLoadMgr.sington.LoadLM(OnLoadFinish));
        }
    }


    private void OnLoadFinish()
    {
        Debug.Log("OnLoadFinish");
        GameObject go1 = GameObject.Find("terrain_root");
        GameObject go2 = GameObject.Find("collider_root");
        GameObject go3 = GameObject.Find("parts");
        TerrainLoadMgr.sington.SetRoot(go1.transform, go2.transform, "LakeTerrain");
        TerrainLoadMgr.sington.EnableBox(true);
        if (go3 != null) go3.SetActive(false);
    }
   
    private void Update()
    {
        AsynLoadMgr.sington.Update();
    }
}