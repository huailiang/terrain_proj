using UnityEngine;

public class TerrainNode : MonoBehaviour
{

    public int x = 0;

    public int y = 0;

    public Collider box;


    private void OnTriggerEnter(Collider other)
    {
        TerrainLoadMgr.sington.LoadItem(x, y);
    }


    private void OnTriggerExit(Collider other)
    {
        TerrainLoadMgr.sington.UnloadItem(x, y);
    }


    private void OnTriggerStay(Collider other)
    {
        //Debug.Log("OnTriggerStay: " + other.name);
    }

}
