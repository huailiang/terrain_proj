Shader "Custom/Environment/TerrainSimple"
{
    Properties
    {
        _Texture0 ("Texture 1", 2D) = "white" {}
        _Texture1 ("Texture 2", 2D) = "white" {}
        _Texture2 ("Texture 3", 2D) = "white" {}
        _Texture3 ("Texture 4", 2D) = "white" {}
    }
    
    SubShader
    {
        Tags { "RenderType" = "Opaque" }
        LOD 200
        
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            sampler2D _Texture0;
            sampler2D _Texture1;
            sampler2D _Texture2;
            sampler2D _Texture3;

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                float4 tangent : TANGENT;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float4 weight : TEXCOORD1;
            };

            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.weight = v.tangent;
                o.uv = v.uv;
                return o;
            }

            fixed4 frag(v2f i) : SV_TARGET
            {
                fixed4 t0 = tex2D(_Texture0, i.uv);
                fixed4 t1 = tex2D(_Texture1, i.uv);
                fixed4 t2 = tex2D(_Texture2, i.uv);
                fixed4 t3 = tex2D(_Texture3, i.uv);
                fixed4 tex = t0 * i.weight.x + t1 * i.weight.y + t2 * i.weight.z + t3 * i.weight.w;
                return tex;
            }

            ENDCG
        }
    }

    Fallback "Diffuse"
}