using System.Collections;
using UnityEngine;

public class GameController : MonoBehaviour
{

    private void Awake()
    {
        GameObject go1 = GameObject.Find("terrain_root");
        GameObject go2 = GameObject.Find("collider_root");
        TerrainLoadMgr.sington.SetRoot(go1.transform, go2.transform, "LakeTerrain");
        TerrainLoadMgr.sington.EnableBox(true);
    }


    private IEnumerator Start()
    {
        yield return new WaitForSeconds(0.2f);
        TerrainLoadMgr.sington.ResetRootPos();
    }


    private void Update()
    {
        AsynLoadMgr.sington.Update();
    }
}