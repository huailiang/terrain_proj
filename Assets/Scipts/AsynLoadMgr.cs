using System.Collections.Generic;
using UnityEngine;
using System;

public class AsynLoadMgr
{
    private static AsynLoadMgr _s = null;

    public static AsynLoadMgr sington { get { if (_s == null) _s = new AsynLoadMgr(); return _s; } }

    private Dictionary<int, Node> assetsMap = new Dictionary<int, Node>();

    private Dictionary<int, List<Action<UnityEngine.Object>>> loadingDic = new Dictionary<int, List<Action<UnityEngine.Object>>>();

    public enum State
    {
        Loading,
        Finish
    };

    private class Node
    {
        public UnityEngine.Object asset;
        public State state;
        public ResourceRequest req;
    }

    public void Load(string path, Action<UnityEngine.Object> callback)
    {
        int hash = path.GetHashCode();
        if (assetsMap.ContainsKey(hash))
        {
            Node node = assetsMap[hash];
            if (node.state == State.Loading)
            {
                var list = loadingDic[hash];
                if (list == null) list = new List<Action<UnityEngine.Object>>();
                list.Add(callback);
            }
            else if (node.state == State.Finish)
            {
                callback(node.asset);
            }
        }
        else
        {
            var list = new List<Action<UnityEngine.Object>>();
            list.Add(callback);
            loadingDic.Add(hash, list);

            Node node = new Node() { state = State.Loading, req = Resources.LoadAsync<GameObject>(path) };
            assetsMap.Add(hash, node);
        }
    }


    public void Unload(string path)
    {
        int hash = path.GetHashCode();
        if (assetsMap.ContainsKey(hash))
        {
            Node node = assetsMap[hash];
            if (node.state == State.Finish)
            {
                UnityEngine.Object.Destroy(node.asset);
            }
            assetsMap.Remove(hash);
        }
    }


    public void Update()
    {
        if (assetsMap.Count > 0)
        {
            foreach (var item in assetsMap)
            {
                Node node = item.Value;
                if (node.state == State.Loading)
                {
                    if (node.req.isDone)
                    {
                        node.state = State.Finish;
                        node.asset = node.req.asset;
                        
                        var list = loadingDic[item.Key];
                        for (int i = 0; i < list.Count; i++)
                        {
                            list[i](node.asset);
                        }
                        loadingDic.Remove(item.Key);
                        
                    }
                }
            }
        }
    }

}
