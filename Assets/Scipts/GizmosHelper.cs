using UnityEngine;

public class GizmosHelper : MonoBehaviour {

    public static Bounds bounds;


    private void Awake()
    {
        bounds = new Bounds();
        bounds.center = Vector3.zero;
        bounds.size = 100 * Vector3.one;
    }


    private void OnDrawGizmos()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawCube(bounds.center, bounds.size);
    }

    public static void Set(Bounds _rect)
    {
        bounds = _rect;
    }
}
