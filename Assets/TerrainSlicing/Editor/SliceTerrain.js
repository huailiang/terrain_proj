//Terrain Slicing & Neighboring Kit v1.2 copyright © 2013 Kyle Gillen. All rights reserved. Redistribution is not allowed.

#pragma strict

enum Size {
	_2x2 = 2,
	_4x4 = 4,
	_8x8 = 8,
	_16x16 = 16,
	_32x32 = 32,
	_64x64 = 64
}

class SliceTerrain extends EditorWindow
{

	private var terrainGameObjects : GameObject[];
	private var terrains : Terrain[];
	private var data : TerrainData[];
	

	static var baseTerrain : Terrain;
	private var baseData : TerrainData;
	

	static var enumValue : Size = Size._2x2;
	
	static var resolutionPerPatch : int = 8;
	

	private var fileName : String;

	private var size : int;
	private var terrainsWide : int;
	private var terrainsLong : int;
	

	private var x : int;
	private var y : int;
	private var i : int;
	private var z : int;
	
	private var oldWidth : float;
	private var oldHeight : float;
	private var oldLength : float;
	private var newWidth : float;
	private var newLength : float;
	
	
	private var xPos : float;
	private var yPos : float;
	private var zPos : float;
	
	private var newHeightMapResolution : int;
	private var newEvenHeightMapResolution : int;
	
	
	private var newDetailResolution : int;
	private var newAlphaMapResolution : int;
	private var newBaseMapResolution : int;
	
	private var splatProtos : SplatPrototype[];
	private var detailProtos : DetailPrototype[];
	private var treeProtos : TreePrototype[];
	private var treeInst : TreeInstance[];
	
	private var grassStrength : float;
	private var grassAmount : float;
	private var grassSpeed : float;
	private var grassTint : Color;

	private var layers : int[];
	private var arrayPos : int;
	

	private var progress : float;
	private var progressScale : float;

	private var createPressed : boolean = false;
	
	private var selection : GameObject[];

	private var treeDistance : float;
	private var treeBillboardDistance : float;
	private var treeCrossFadeLength : float;
	private var treeMaximumFullLODCount  : int;
	private var detailObjectDistance : float;
	private var detailObjectDensity : float;
	private var heightmapPixelError : float;
	private var heightmapMaximumLOD : int;
	private var basemapDistance : float;
	private var lightmapIndex : int;
	private var castShadows : boolean;
	private var materialTemplate : Material;
	private var editorRenderFlags : TerrainRenderFlags;

	private var isError : boolean;

	private var overwrite : boolean = false;
	static var blend : boolean = true;
	
	static var copyAllTrees : boolean;
	static var copyAllDetails : boolean;
	
	//tooltips for displaying additional information on mouseover
	private var label1 : GUIContent;
	private var label2 : GUIContent;
	private var label3 : GUIContent;
	private var label4 : GUIContent;
	private var label5 : GUIContent;
	private var label6 : GUIContent;
	private var label7 : GUIContent;
	private var label8 : GUIContent;
	private var label9 : GUIContent;
	private var label10 : GUIContent;
	
	
	@MenuItem ("Terrain/Slice Terrain")
    static function ShowWindow () {
        var window = EditorWindow.GetWindow (SliceTerrain);
        window.position = Rect(Screen.width/2 + 300,400,600,300);
        
    }

	function OnEnable()
	{

		minSize = Vector2(660,370);
		
		if(Application.isPlaying)
			isError = true;
		else
			isError = false;
		
		if(!isError)
		{

			if(!PlayerPrefs.HasKey("File Path"))
			{
	        	PlayerPrefs.SetString("File Path", "Assets/TerrainSlicing/TerrainData");
	        	fileName = "Assets/TerrainSlicing/TerrainData";
	        }
	        else
	        	fileName = PlayerPrefs.GetString("File Path");
	        
			selection = Selection.gameObjects;
			
	    	if(selection.Length == 1)
	    		if(selection[0].GetComponent(Terrain) != null)
	    			baseTerrain = selection[0].GetComponent(Terrain);
	    		else
	    			Debug.Log("Selection Error - Could not get selection : Selection is not a terrain!");
	    	else if(selection.Length > 1)
	    		Debug.Log("Selection Error - Could not get selection : Too many objects selected!");
	    	
	    	//Create the tooltips
		    label1 = new GUIContent("Base Terrain to Slice","This terrain's resolution data must be large enough so that when sliced," + 
		    "the resulting terrain pieces resolutions are greater than their minimum allowable values. Minimum values are:\n" +
		    "Heightmap - 33\nBaseMap - 16\nControl Texture - 16\nDetail - Cannot be 0");
		    
		    label2 = new GUIContent("Resolution Per Patch","Ideally, this should be the same as your base terrain's detail resolution per patch.");
		    
		    label3 = new GUIContent("Slicing Dimensions","ex: 2 x 2 will divide terrain by 2 along x axis and 2 along z axis, producing 4 terrain slices.\n" +
		    "4 x 4 will divide by 4, producing 16 terrain slices, and so on . . .");
		    
		    label4 = new GUIContent("File Path to Store Data","This is the file path where the created terrain data will be stored.");
		    
		    label5 = new GUIContent("Reset File Path to Default: " + PlayerPrefs.GetString("File Path"),"This button simply resets the field above with the " +
		    "default file path stored in player prefs (which you can change at any time by entering a new file path above and clicking the button below this one)."+
		    "Use this if you make a mistake or need to reset the file path to the default for any reason.");
		    
		    label6 = new GUIContent("Save Current File Path as Default File Path","Click this if you want the file path entered above to be saved as the default file path." +
		    "This will make this file path the default file path shown in the above field when you open the Terrain Slicing Tool.");
		    
		    label7 = new GUIContent("Overwrite Terrain Data","The terrain data names are derived from the base terrain's name, so if you try to slice a terrain with the same name as a terrain that you've " +
		    "sliced in the past, you risk overwriting the existing terrain data.\n\nYou may wish for this data to be overwritten, but to keep you from overwriting data on accident " +
		    "I've included this checkbox field. By default it is unchecked, and the program will not let you overwrite data while it is left unchecked. So if you intentionally want " +
		    "to overwrite data, check this box.");
		    
		    label8 = new GUIContent("Blend Alpamap Edges","This option will set the alphamap edges of neighboring terrains to the same value, which blends the edges " +
		    "of the neighboring terrain's alphamaps so that there is no visible seem between the two (also blends corner between 4 terrains).\n\n" +
		    "This blending will very slightly alter the alphamaps of the terrains, which you will notice in some instances, but these changes should not present much of a problem.\n\n" +
		    "You can also try slicing with this option unchecked, but you will need to manually check the seems between terrains to ensure none are visible. If they are, you will have to re-slice with the blending option checked.");
		    
		    label9 = new GUIContent("Copy All Trees","The base terrain contains a list of trees which you can paint on it. By default the program will copy every " +
		    "tree from this list to every terrain slice created during the slicing process, regardless of whether that terrain slice currently has that tree painted on it.\n\n" +
		    "If you want each newly created terrain slice to have the full list of trees from the base terrain, leave this box checked.\n\n" +
		    "However, if you would rather copy only those trees which the terrain slice has painted on it, uncheck this box.\n\nRegardless of the option you choose, all visible trees on your terrain will be copied to the new terrains accurately.");
		    
		    label10 = new GUIContent("Copy All Detail Meshes","The base terrain contains a list of detail meshes (plants and grasses which you can paint on it. By default the program will copy every " +
		    "detail mesh from this list to every terrain slice created during the slicing process, regardless of whether that terrain slice currently has the detail mesh painted on it.\n\n" +
		    "If you want each newly created terrain slice to have the full list of detail meshes from the base terrain, leave this box checked.\n\n" +
		    "However, if you would rather copy only those detail meshes which the terrain slice has painted on it, uncheck this box.\n\nRegardless of the option you choose, all visible detail meshes on your terrain will be copied to the new terrains with high accuracy.");
	    } 
	}
	
	//Our GUI
	function OnGUI()
	{
		if(Application.isPlaying)
			isError = true;

		if(!isError)
		{
			
			GUILayout.Label ("Configuration", EditorStyles.boldLabel);
			
			
			EditorGUILayout.LabelField("Hover over the field labels (left of each field) or buttons to view more detailed information about each field.");
			EditorGUILayout.LabelField("");
			baseTerrain = EditorGUILayout.ObjectField (label1, baseTerrain, Terrain, true) as Terrain;
			
			EditorGUILayout.LabelField("");// Used for Spacing only// Used for Spacing only
			
			resolutionPerPatch = EditorGUILayout.IntField (label2, resolutionPerPatch);
			EditorGUILayout.LabelField("");	// Used for Spacing only

			enumValue = System.Convert.ToInt32(EditorGUILayout.EnumPopup(label3, enumValue));
			EditorGUILayout.LabelField("");// Used for Spacing only
			
			fileName = EditorGUILayout.TextField(label4, fileName);
			if(GUILayout.Button(label5))
			{
				GUIUtility.keyboardControl = 0;
				fileName = PlayerPrefs.GetString("File Path");
			}

			if(GUILayout.Button(label6))
				SaveFilePath();
			EditorGUILayout.LabelField("");	// Used for Spacing only
			
			overwrite = EditorGUILayout.Toggle(label7, overwrite);
			blend = EditorGUILayout.Toggle(label8, blend);
			
			copyAllTrees = EditorGUILayout.Toggle(label9, copyAllTrees);
			copyAllDetails = EditorGUILayout.Toggle(label10, copyAllDetails);
			
			EditorGUILayout.LabelField("");	// Used for Spacing only

			if(GUILayout.Button("Create Terrain"))
			{
				if(baseTerrain != null)
				{
					createPressed = true;

					StoreData();

					if(CheckForErrors())
					{
						CreateTerrainData();
						CopyTerrainData();
						//Optional step
						if(blend)
							BlendEdges();
						SetNeighbors();
						this.Close();
					}
					else
						createPressed = false;
				}
				else
				{
					this.ShowNotification(GUIContent("Base Terrain must be selected."));
					GUIUtility.keyboardControl = 0; // Added to shift focus to original window rather than the notification
				}
			}
		}
		else
				EditorGUILayout.LabelField("The Terrain Slicing Tool cannot operate in play mode. Exit play mode and reselect Slicing Option.");

				
	}//End the OnGUI function
	
	//Saves the current filepath stored in fileName to the key "File Path" in PlayerPrefs
	function SaveFilePath()
	{
		PlayerPrefs.SetString("File Path", fileName);
		label5 = new GUIContent("Reset File Path to Default: " + PlayerPrefs.GetString("File Path"),"This button simply resets the field above with the " +
	    "default file path stored in player prefs (which you can change at any time by entering a new file path above and clicking the button below this one)."+
	    "Use this if you make a mistake or need to reset the file path to the default for any reason.");
	}
	
	//Retrieve and store all the data from the old terrain into our variables
	function StoreData()
	{
		size = enumValue;
		terrainsLong = size;
		terrainsWide = size;

		baseData = baseTerrain.terrainData;
		
		oldWidth = baseData.size.x;
		oldHeight = baseData.size.y;
		oldLength = baseData.size.z;
		
		newWidth = oldWidth / terrainsWide;
		newLength = oldLength / terrainsLong;
					
		xPos = baseTerrain.GetPosition().x;
		yPos = baseTerrain.GetPosition().y;
		zPos = baseTerrain.GetPosition().z;
		
		newHeightMapResolution = ((baseData.heightmapResolution - 1) / size) + 1;
		newEvenHeightMapResolution = newHeightMapResolution - 1;
		
		newDetailResolution = baseData.detailResolution / size;
		newAlphaMapResolution = baseData.alphamapResolution / size;
		newBaseMapResolution = baseData.baseMapResolution / size;
		
		treeDistance = baseTerrain.treeDistance;
		treeBillboardDistance = baseTerrain.treeBillboardDistance;
		treeCrossFadeLength = baseTerrain.treeCrossFadeLength;
		treeMaximumFullLODCount  = baseTerrain.treeMaximumFullLODCount;
		detailObjectDistance = baseTerrain.detailObjectDistance;
		detailObjectDensity = baseTerrain.detailObjectDensity;
		heightmapPixelError = baseTerrain.heightmapPixelError;
		heightmapMaximumLOD = baseTerrain.heightmapMaximumLOD;
		basemapDistance = baseTerrain.basemapDistance;
		lightmapIndex = baseTerrain.lightmapIndex;
		castShadows = baseTerrain.castShadows;
		editorRenderFlags = baseTerrain.editorRenderFlags;
		
		//******Line to uncomment below if Using 4.x.x********//
		//****************************************************//
		//****************************************************//
		//materialTemplate = baseTerrain.materialTemplate;
		//****************************************************//
		//****************************************************//
		//************Line to uncomment above*****************//
		
		splatProtos = baseData.splatPrototypes;
		detailProtos = baseData.detailPrototypes;		
		treeProtos = baseData.treePrototypes;
		treeInst = baseData.treeInstances;
		
		grassStrength = baseData.wavingGrassStrength;
		grassAmount = baseData.wavingGrassAmount;
		grassSpeed = baseData.wavingGrassSpeed;
		grassTint = baseData.wavingGrassTint;
	}
	
	//Check for any errors with User Input
	function CheckForErrors() : boolean
	{
		if(resolutionPerPatch < 8)
		{
			this.ShowNotification(GUIContent("Resolution Per Patch must be 8 or greater"));
			GUIUtility.keyboardControl = 0; // Added to shift focus to original window rather than the notification
			return false;
		}
		else if(!Mathf.IsPowerOfTwo(resolutionPerPatch))
		{
			this.ShowNotification(GUIContent("Resolution Per Patch must be a power of 2"));
			GUIUtility.keyboardControl = 0;
			return false;
		}
		else if(newHeightMapResolution < 33)
		{
			this.ShowNotification(GUIContent("Error with Heightmap Resolution - See Console for More Information"));
			GUIUtility.keyboardControl = 0;
			Debug.Log("The Heightmap Resolution for the new terrains must be 33 or larger. Currently it is " + newHeightMapResolution.ToString() + ".\nThe new Heightmap Resolution is calculated as"
			+ "follows: New Resolution = ((Old Resolution - 1) / New Dimension Width) + 1 -- For example, a 4x4 grid has a New Dimension Width of 4.\n You can rectify this problem by"
			+ "either increasing the heightmap resolution of the base terrain, or reducing the number of new terrains to be created.");
			return false;
		}
		else if(newAlphaMapResolution < 16)
		{
			this.ShowNotification(GUIContent("Error with AlphaMap Resolution - See Console for More Information"));
			GUIUtility.keyboardControl = 0;
			Debug.Log("The Alpha Map Resolution of the new terrains is too small. Value must be 16 or greater. Current value is " + newAlphaMapResolution.ToString()
			+ ".\nPlease increase the Base Terrains alpha map resolution or reduce the number of new terrains to be created.");
			return false;
		}
		else if(newBaseMapResolution < 16)
		{
			this.ShowNotification(GUIContent("Error with BaseMap Resolution - See Console for More Information"));
			GUIUtility.keyboardControl = 0;
			Debug.Log("The Base Map Resolution of the new terrains is too small. Value must be 16 or greater. Current value is " + newBaseMapResolution.ToString()
			+ ".\nPlease increase the Base Terrains base map resolution or reduce the number of new terrains to be created.");
			return false;
		}
		else if(baseData.detailResolution%size != 0)
		{
			this.ShowNotification(GUIContent("Error with Detail Resolution - See Console for More Information"));
			GUIUtility.keyboardControl = 0;
			Debug.Log("The Base Terrains detail resolution does not divide perfectly. Please change the detail resolution or number of terrains to be created to rectify this issue.");
			return false;
		}
		else if(!overwrite && AssetDatabase.LoadAssetAtPath(fileName + "/" + baseTerrain.name + "_Data_" + 1 + "_" + 1 + ".asset", TerrainData) != null)
		{
			
			this.ShowNotification(GUIContent("Terrain Data with this name already exist. Please check 'Overwrite' if you wish to overwrite the existing Data"));
			GUIUtility.keyboardControl = 0;
			return false;
		}
		else
			return true;
	}	
	
	//Create the terrain data (including
	function CreateTerrainData()
	{
		progress = 0.0f;
		EditorUtility.DisplayProgressBar("Progress", "Generating Terrains", progress);
		
		if(!Mathf.IsPowerOfTwo(newDetailResolution))
			Debug.Log("Detail Resolution of new terrains is not a power of 2. Accurate results are not guaranteed.");
		
		if(newDetailResolution%resolutionPerPatch != 0)
			Debug.Log("Detail Resolution of new terrains does not divide resolution per patch value evenly. Unity will\n" +
			" automatically downgrade resolution to a value that does divide evenly, however, accurate results are not guaranteed.");
		
		terrainGameObjects = new GameObject[terrainsLong*terrainsWide];
		
		terrains = new Terrain[terrainsLong*terrainsWide];
		
		data = new TerrainData[terrainsLong*terrainsWide];	
		
		progressScale = .9f / (terrainsLong*terrainsWide);
		
		for(y = 0; y < terrainsLong ; y++)
		{
			for(x = 0; x < terrainsWide; x++)
			{
				AssetDatabase.CreateAsset(new TerrainData(), fileName + "/" + baseTerrain.name + "_Data_" + (y+1) + "_" + (x+1) + ".asset");
				progress += progressScale;
				EditorUtility.DisplayProgressBar("Progress", "Generating Terrains", progress);
			}
		}
	}
	
	function CopyTerrainData()
	{
		progressScale = .2f / (terrainsLong*terrainsWide);
		arrayPos = 0;
		
		for(y = 0; y < terrainsLong ; y++)
		{
			for(x = 0; x < terrainsWide; x++)
			{				
				terrainGameObjects[arrayPos] = Terrain.CreateTerrainGameObject(AssetDatabase.LoadAssetAtPath(fileName + "/" + baseTerrain.name + "_Data_" + (y+1) + "_" + (x+1) + ".asset", TerrainData));
				
				terrainGameObjects[arrayPos].name = baseTerrain.name + "_Slice_" + (y+1) + "_" + (x+1);

				terrains[arrayPos] = terrainGameObjects[arrayPos].GetComponent(Terrain);
				
				data[arrayPos] = terrains[arrayPos].terrainData;
				
				data[arrayPos].heightmapResolution = newEvenHeightMapResolution;
				
				data[arrayPos].alphamapResolution = newAlphaMapResolution;
				
				data[arrayPos].baseMapResolution = newBaseMapResolution;
				
				data[arrayPos].SetDetailResolution(newDetailResolution, resolutionPerPatch);

				data[arrayPos].size = Vector3(newWidth, oldHeight, newLength);

				//Splat prototypes
				var tempSplats : SplatPrototype[] = new SplatPrototype[splatProtos.Length];
				
				for(i = 0; i < splatProtos.Length; i++)
				{
					tempSplats[i] = new SplatPrototype();
					tempSplats[i].texture = splatProtos[i].texture;
					
					//******Line to uncomment below if Using 4.x.x********//
					//****************************************************//
					//****************************************************//
					//tempSplats[i].normalMap = splatProtos[i].normalMap;
					//****************************************************//
					//****************************************************//
					//************Line to uncomment above*****************//
		
					tempSplats[i].tileSize.x = splatProtos[i].tileSize.x;
					tempSplats[i].tileSize.y = splatProtos[i].tileSize.y;

					tempSplats[i].tileOffset.x = (newWidth*x)%splatProtos[i].tileSize.x + splatProtos[i].tileOffset.x;
					tempSplats[i].tileOffset.y = (newLength*y)%splatProtos[i].tileSize.y + splatProtos[i].tileOffset.y;
				}
				data[arrayPos].splatPrototypes = tempSplats;
				
				
				
				
								
				layers = baseData.GetSupportedLayers(x * data[arrayPos].detailWidth-1, y * data[arrayPos].detailHeight-1, data[arrayPos].detailWidth, data[arrayPos].detailHeight);
				var layerLength : int = layers.Length;
				
				if(copyAllDetails)
					data[arrayPos].detailPrototypes = detailProtos;	
				else
				{
					var tempDetailProtos : DetailPrototype[] = new DetailPrototype[layerLength];
					for(i = 0; i < layerLength; i++)
						tempDetailProtos[i] = detailProtos[layers[i]];
					data[arrayPos].detailPrototypes = tempDetailProtos;
				}
					
				for(i = 0; i < layerLength ; i++)
					data[arrayPos].SetDetailLayer(0, 0, i, baseData.GetDetailLayer(x * data[arrayPos].detailWidth, y * data[arrayPos].detailHeight, data[arrayPos].detailWidth, data[arrayPos].detailHeight, layers[i]));
				
				System.Array.Clear(layers, 0, layers.Length);
				
				//if copy all trees is checked, we can just set each terrains tree prototypes to the base terrain. We'll skip this step if it's unchecked, and execute
				//a more complicated algorithm below instead.
				if(copyAllTrees)
					data[arrayPos].treePrototypes = treeProtos;
					
				
				
				data[arrayPos].wavingGrassStrength = grassStrength;
				data[arrayPos].wavingGrassAmount = grassAmount;
				data[arrayPos].wavingGrassSpeed = grassSpeed;
				data[arrayPos].wavingGrassTint = grassTint;
				
				
				
				data[arrayPos].SetHeights(0, 0, baseData.GetHeights(x * (data[arrayPos].heightmapWidth -1), y * (data[arrayPos].heightmapHeight - 1), data[arrayPos].heightmapWidth, data[arrayPos].heightmapHeight));
				var map : float[,,] = new float[newAlphaMapResolution, newAlphaMapResolution, splatProtos.Length];
				map = baseData.GetAlphamaps(x * data[arrayPos].alphamapWidth, y * data[arrayPos].alphamapHeight, data[arrayPos].alphamapWidth, data[arrayPos].alphamapHeight);
				data[arrayPos].SetAlphamaps(0, 0, map);
		
				terrainGameObjects[arrayPos].GetComponent(TerrainCollider).terrainData = data[arrayPos];
				
				terrainGameObjects[arrayPos].transform.position = Vector3(x * newWidth + xPos, yPos, y * newLength + zPos);
				

				
				arrayPos++;
				
				progress += progressScale;
				
				EditorUtility.DisplayProgressBar("Progress", "Generating Terrains", progress);
				
			}//End the x for loop
		}//End the y for loop
		
		for(y = 0; y < terrains.Length ; y++)
		{
			terrains[y].treeDistance = treeDistance;
			terrains[y].treeBillboardDistance = treeBillboardDistance;
			terrains[y].treeCrossFadeLength = treeCrossFadeLength;
			terrains[y].treeMaximumFullLODCount  = treeMaximumFullLODCount;
			terrains[y].detailObjectDistance = detailObjectDistance;
			terrains[y].detailObjectDensity = detailObjectDensity;
			terrains[y].heightmapPixelError = heightmapPixelError;
			terrains[y].heightmapMaximumLOD = heightmapMaximumLOD;
			terrains[y].basemapDistance = basemapDistance;
			terrains[y].lightmapIndex = lightmapIndex;
			terrains[y].castShadows = castShadows;
			terrains[y].editorRenderFlags = editorRenderFlags;
			
			//******Line to uncomment below if Using 4.x.x********//
			//****************************************************//
			//****************************************************//
			//terrains[y].materialTemplate = materialTemplate;
			//****************************************************//
			//****************************************************//
			//************Line to uncomment above*****************//
		}
		//Only execute these lines of code if copyAllTrees is false
		if(!copyAllTrees)
		{
			var treeTypes : int[,] = new int[terrainsWide*terrainsLong, treeProtos.Length];
			
			
			//Loop through every single tree
			for(i = 0; i < treeInst.Length ; i++)
			{
				var origPos2 : Vector3 = Vector3.Scale(Vector3(oldWidth, 1, oldLength), Vector3(treeInst[i].position.x, treeInst[i].position.y, treeInst[i].position.z));
			
				var column2 : int = Mathf.FloorToInt(origPos2.x/newWidth);
				var row2 : int = Mathf.FloorToInt(origPos2.z/newLength);
				
				treeTypes[(row2*terrainsWide) + column2, treeInst[i].prototypeIndex] = 1;
			}
	
			for(i = 0; i < terrainsWide*terrainsLong; i++)
			{
				var numOfPrototypes : int = 0;
				for(y = 0; y < treeProtos.Length; y++)
					if(treeTypes[i,y] == 1)
						numOfPrototypes++;
					//else --not necessary I think
						//treeTypes[i,y] = treeProtos.Length; //replace the 0 at this spot with the length of the treeProtos array. Later, if we find this spot has this value,
						                                    //we'll know that this prototype is not found on this terrain. We will need to know this.
				var tempPrototypes : TreePrototype[] = new TreePrototype[numOfPrototypes];
				var tempIndex : int = 0;
				for(y = 0; y < treeProtos.Length; y++)
					if(treeTypes[i,y] == 1)
					{
						tempPrototypes[tempIndex] = treeProtos[y];
						//In addition, replace the value at tempTypes[i,y] with the index of where that prototype is stored for that terrain, like this
						treeTypes[i,y] = tempIndex;
						tempIndex++;
					}
					
				data[i].treePrototypes = tempPrototypes;
			}
		}
		
		for(i = 0; i < treeInst.Length ; i++)
		{
			var origPos : Vector3 = Vector3.Scale(Vector3(oldWidth, 1, oldLength), Vector3(treeInst[i].position.x, treeInst[i].position.y, treeInst[i].position.z));
		
			var column : int = Mathf.FloorToInt(origPos.x/newWidth);
			var row : int = Mathf.FloorToInt(origPos.z/newLength);
			
			var tempVect : Vector3 = new Vector3((origPos.x-(newWidth*column))/newWidth, origPos.y, (origPos.z-(newLength*row))/newLength);
			var tempTree : TreeInstance;
			
			tempTree.position = tempVect;
			tempTree.widthScale = treeInst[i].widthScale;
			tempTree.heightScale = treeInst[i].heightScale;
			tempTree.color = treeInst[i].color;
			tempTree.lightmapColor = treeInst[i].lightmapColor;
			
			if(copyAllTrees)
				tempTree.prototypeIndex = treeInst[i].prototypeIndex;
			else
				tempTree.prototypeIndex = treeTypes[(row*terrainsWide) + column, treeInst[i].prototypeIndex];
			
			terrains[(row*terrainsWide) + column].AddTreeInstance(tempTree);
			
			
			
		}
		//refresh prototypes
		for(i = 0; i < terrainsWide*terrainsLong; i++)
			data[i].RefreshPrototypes();
	}
	
	function BlendEdges()
	{
		var alphaWidth : int = data[0].alphamapWidth;
		var alphaHeight : int = data[0].alphamapHeight;
		var numOfSplats : int = data[0].splatPrototypes.Length;
		var avg : float;
		
		if(terrainsWide > 1 && terrainsLong == 1)
		{
			for(x = 0; x < terrainsWide-1; x++)
			{
				var mapLeft : float[,,] = data[x].GetAlphamaps(0, 0, alphaWidth, alphaHeight);
				var mapRight : float[,,] = data[x+1].GetAlphamaps(0, 0, alphaWidth, alphaHeight);
	
				for(i = 0; i < alphaHeight; i++)
					for(y = 0; y < numOfSplats; y++)
					{
						avg = (mapLeft[i, alphaWidth-1, y] + mapRight[i, 0, y]) / 2f;
						mapLeft[i, alphaWidth-1, y] = avg;
						mapRight[i, 0, y] = avg;
					}
				
				data[x].SetAlphamaps(0, 0, mapLeft);
				data[x+1].SetAlphamaps(0,0, mapRight);
			}
		}
		
		
		//Single column / multiiple rows
		else if(terrainsLong > 1 && terrainsWide == 1)
		{
			
			
			for(x = 0; x < terrainsLong-1; x++)
			{				
				var mapBottom : float[,,] = data[x].GetAlphamaps(0, 0, alphaWidth, alphaHeight);
				var mapTop : float[,,] = data[x+1].GetAlphamaps(0, 0, alphaWidth, alphaHeight);
				
				for(i = 0; i < alphaWidth; i++)
					for(y = 0; y < numOfSplats; y++)
					{
						avg = (mapBottom[alphaHeight-1, i, y] + mapTop[0, i, y]) / 2f;
						mapBottom[alphaHeight-1, i, y] = avg;
						mapTop[0, i, y] = avg;
					}
				
				data[x].SetAlphamaps(0, 0, mapBottom);
				data[x+1].SetAlphamaps(0,0, mapTop);
			}
		}
		
		//multiple row/ columns
		else if(terrainsWide > 1 && terrainsLong > 1)
		{	
			//set arrayPos to -2 so it will be at 0 for the first terrain.		
			arrayPos = -2;
			for(z = 0; z < terrainsLong - 1; z++)
			{
				arrayPos ++;
				for(x = 0; x < terrainsWide - 1; x++)
				{
					arrayPos++;
					var mapBLeft : float[,,] = data[arrayPos].GetAlphamaps(0,0, alphaWidth, alphaHeight);
					var mapBRight : float[,,] = data[arrayPos+1].GetAlphamaps(0,0, alphaWidth, alphaHeight);
					var mapTLeft : float[,,] = data[arrayPos+terrainsWide].GetAlphamaps(0,0, alphaWidth, alphaHeight);
					var mapTRight : float[,,] = data[arrayPos+terrainsWide+1].GetAlphamaps(0,0, alphaWidth, alphaHeight);
				
					//Always do these two things, no matter where the terrain lies in the group
					
					//Set the edge between the BRight and TRight
					for(i = 1; i < alphaWidth-1; i++)
						for(y = 0; y < numOfSplats; y++)
						{
							avg = (mapBRight[alphaHeight-1, i, y] + mapTRight[0, i, y]) / 2f;
							mapBRight[alphaHeight-1, i, y] = avg;
							mapTRight[0, i, y] = avg;
						}
					
					//Set the edge between the top left and top right terrains
					for(i = 1; i < alphaHeight-1; i++)
						for(y = 0; y < numOfSplats; y++)
						{
							avg = (mapTLeft[i, alphaWidth-1, y] + mapTRight[i, 0, y]) / 2f;
							mapTLeft[i, alphaWidth-1, y] = avg;
							mapTRight[i, 0, y] = avg;
						}
							
					//Set the corner between the four terrains
					for(y = 0; y < numOfSplats; y++)
					{
						avg = (mapBLeft[alphaHeight-1, alphaWidth-1, y] + mapBRight[alphaHeight-1, 0, y] + mapTLeft[0, alphaWidth-1, y] + mapTRight[0, 0, y]) / 4f;
						mapBLeft[alphaHeight-1, alphaWidth-1, y] = avg;
						mapBRight[alphaHeight-1, 0, y] = avg;
						mapTLeft[0, alphaWidth-1, y] = avg;
						mapTRight[0, 0, y] = avg;
					}
					
					//If the terrain is on the bottom row
					if(z == 0)
					{
						//Set the edge between the bottom left and bottom right terrains
						for(i = 1; i < alphaHeight-1; i++)
							for(y = 0; y < numOfSplats; y++)
							{
								avg = (mapBLeft[i, alphaWidth-1, y] + mapBRight[i, 0, y]) / 2f;
								mapBLeft[i, alphaWidth-1, y] = avg;
								mapBRight[i, 0, y] = avg;
							}

						//Set the bottom most spot point between BLeft and BRight
						for(y = 0; y < numOfSplats; y++)
						{
							avg = (mapBLeft[0, alphaWidth-1, y] + mapBRight[0, 0, y]) / 2f;
							mapBLeft[0, alphaWidth-1, y] = avg;
							mapBRight[0, 0, y] = avg;
						}
					}	
						
							
					//If the terrain is also in the first column
					if(x == 0)
					{	
						//Set the edge between the BLeft and TLeft
						for(i = 1; i < alphaWidth-1; i++)
							for(y = 0; y < numOfSplats; y++)
							{
								avg  = (mapBLeft[alphaHeight-1, i, y] + mapTLeft[0, i, y]) / 2f;
								mapBLeft[alphaHeight-1, i, y] = avg;
								mapTLeft[0, i, y] = avg;
							}
							
						
						//Set the left most point between BLeft and TLeft
						for(y = 0; y < numOfSplats; y++)
						{
							avg = (mapBLeft[alphaHeight-1, 0, y] + mapTLeft[0, 0, y]) / 2f;
							mapBLeft[alphaHeight-1, 0, y] = avg;
							mapTLeft[0, 0, y] = avg;
						}
						
						
					}
					
					//if this is the second to last terrain in the row
					if(x == terrainsWide - 2)
						for(y = 0; y < numOfSplats; y++)
						{
							//Set the right most point between the Bright map and Tright map
							avg = (mapBRight[alphaHeight-1, alphaWidth-1, y] + mapTRight[0, alphaWidth-1, y]) / 2f;
							mapBRight[alphaHeight-1, alphaWidth-1, y] = avg;
							mapTRight[0, alphaWidth-1, y] = avg;
						}
					//if this is the second to last terrain in the column
					if(z == terrainsLong - 2)
						for(y = 0; y < numOfSplats; y++)
						{
							//Set the right most point between the TLeft map and TRight map
							avg = (mapTLeft[alphaHeight-1, alphaWidth-1, y] + mapTRight[alphaHeight-1, 0, y]) / 2f;
							mapTLeft[alphaHeight-1, alphaWidth-1, y] = avg;
							mapTRight[alphaHeight-1, 0, y] = avg;
						}
					
					data[arrayPos].SetAlphamaps(0, 0, mapBLeft);
					data[arrayPos+1].SetAlphamaps(0,0, mapBRight);
					data[arrayPos+terrainsWide].SetAlphamaps(0, 0, mapTLeft);
					data[arrayPos+terrainsWide+1].SetAlphamaps(0,0, mapTRight);
				}//End of x loop
			}//End of z loop
		}//End of else if
	}//End of Blend function
	
	
			
	function SetNeighbors()
	{
		arrayPos = 0;
		
		for(y = 0; y < terrainsLong ; y++)
		{
			for(x = 0; x < terrainsWide; x++)
			{
				if(y == 0)
				{
					if(x == 0)
						terrains[arrayPos].SetNeighbors(null, terrains[arrayPos + terrainsWide], terrains[arrayPos + 1], null);
					else if(x == terrainsWide - 1)
						terrains[arrayPos].SetNeighbors(terrains[arrayPos - 1], terrains[arrayPos + terrainsWide], null, null);
					else
						terrains[arrayPos].SetNeighbors(terrains[arrayPos - 1], terrains[arrayPos + terrainsWide], terrains[arrayPos + 1], null);
				}
				else if(y == terrainsLong - 1)
				{
					if(x == 0)
						terrains[arrayPos].SetNeighbors(null, null, terrains[arrayPos + 1], terrains[arrayPos - terrainsWide]);
					else if(x == terrainsWide - 1)
						terrains[arrayPos].SetNeighbors(terrains[arrayPos - 1], null, null, terrains[arrayPos - terrainsWide]);
					else
						terrains[arrayPos].SetNeighbors(terrains[arrayPos - 1], null, terrains[arrayPos + 1], terrains[arrayPos - terrainsWide]);
				}
				else
				{
					if(x == 0)
						terrains[arrayPos].SetNeighbors(null, terrains[arrayPos + terrainsWide], terrains[arrayPos + 1], terrains[arrayPos - terrainsWide]);
					else if(x == terrainsWide - 1)
						terrains[arrayPos].SetNeighbors(terrains[arrayPos - 1], terrains[arrayPos + terrainsWide], null, terrains[arrayPos - terrainsWide]);
					else
						terrains[arrayPos].SetNeighbors(terrains[arrayPos - 1], terrains[arrayPos + terrainsWide], terrains[arrayPos + 1], terrains[arrayPos - terrainsWide]);
				}
				
				//Increment arrayPos
				arrayPos++;
			}//End the x for loop	
		}//End the y for loop
		
		for(i = 0; i < terrainsWide*terrainsLong ; i++)
			terrains[i].Flush();
				
		EditorUtility.ClearProgressBar();
		
	}//End the button press if statement
	
}//End the MakeTerrain Class