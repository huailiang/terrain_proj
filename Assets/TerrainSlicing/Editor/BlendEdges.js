//Terrain Slicing & Neighboring Kit v1.2 copyright © 2013 Kyle Gillen. All rights reserved. Redistribution is not allowed.

import System.IO;

class BlendEdges extends EditorWindow
{

	private var data : TerrainData[];
	private var terrains : Terrain[];
	private var terrainSelections : Terrain[];
	private var baseTerrain : Terrain;

	private var selections : Terrain[];
	private var selection : GameObject[];
	
	private var i : int;
	private var y : int;
	private var x : int;
	private var z : int;
	
	private var terrainsWide : int;
	private var terrainsLong : int;
	private var arrayPos : int;
	
	private var beenPressed : boolean;
	private var showFoldout : boolean;
	private var isError : boolean;
	private var allTerrainsFilled : boolean;
		
	private var label1 : GUIContent;
	private var label2 : GUIContent;
	private var label3 : GUIContent;
	private var label4 : GUIContent;
	
	private var scrollPosition : Vector2;
	
	@MenuItem ("Terrain/Blend Edges")
    static function ShowWindow () {
        var window = EditorWindow.GetWindow (BlendEdges);
        window.position = Rect(Screen.width/2 + 300,400,600,300);
        
    }

	function OnEnable()
	{

		minSize = Vector2(600,320);
		
		if(Application.isPlaying)
			isError = true;
		else
			isError = false;
		
		if(!isError)
		{
			selection = Selection.gameObjects;
			
	    	if(selection.Length == 1)
	    		if(selection[0].GetComponent(Terrain) != null)
	    			baseTerrain = selection[0].GetComponent(Terrain);
	    		else
	    			Debug.Log("Selection Error - Could not get selection : Selection is not a terrain!");
	    	else if(selection.Length > 1)
	    		Debug.Log("Selection Error - Could not get selection : Too many objects selected!");
	    		
	    	beenPressed = false;
	    	showFoldout = true;
	    	allTerrainsFilled = false;
	    	
	    	terrainsWide = 2;
	    	terrainsLong = 2;
	    	
	    	terrainSelections = new Terrain[terrainsWide*terrainsLong];
	    	label1 = new GUIContent("First Terrain in Group","The first terrain is the terrain with the smalles x and z value for its position among the terrains in your group. From a top down view, it should be on the bottom left-most terrain.");
	    	label2 = new GUIContent("Terrains Wide", "This value represents the number of terrains that exist in a single row (along x axis) of your terrain group.");
	    	label3 = new GUIContent("Terrains Tall", "This value represents the number of terrains that exist in a single column (along z axis) of your terrain group.");
	    	label4 = new GUIContent("Terrains in Group", "Fill the fields below with all the terrains in your terrain group, starting with the first terrain, and preceding in order from left to right, then bottom to top.\n\n" +
	    	"Press the 'Auto Fill From Scene' button to have the script try and automatically fill these fields in for you.");
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
			

			baseTerrain = EditorGUILayout.ObjectField (label1, baseTerrain, Terrain, true) as Terrain;
			
			terrainsWide = EditorGUILayout.IntField(label2, terrainsWide);
			terrainsLong = EditorGUILayout.IntField(label3, terrainsLong);
		
			
			showFoldout = EditorGUILayout.Foldout(showFoldout, label4);
			
			if(showFoldout)
			{
				
				if(GUILayout.Button("Auto Fill From Scene"))
				{
					if(baseTerrain != null)
						FillSelections();
					else
					{
						this.ShowNotification(GUIContent("First terrain must be selected for Auto Fill to work."));
						GUIUtility.keyboardControl = 0; // Added to shift focus to original window rather than the notification
					}
				}
				
				if(terrainSelections.Length != terrainsWide*terrainsLong)
				{
					tempArray = new Terrain[terrainsWide*terrainsLong];
					for(i = 0; i < terrainsWide*terrainsLong ; i++)
						if(terrains.Length > i)
							tempArray[i] = terrains[i];
					
					terrainSelections = tempArray;
				}
				scrollPosition = GUILayout.BeginScrollView(scrollPosition, GUILayout.Width(590), GUILayout.Height(175));
				for(i = 0; i < terrainSelections.Length; i++)
					terrainSelections[i] = EditorGUILayout.ObjectField ("Terrain " + i, terrainSelections[i], Terrain, true) as Terrain;
				GUILayout.EndScrollView();
				
			}
			
			
			if(GUILayout.Button("Blend Edges"))
			{
				if(!beenPressed)
				{
					beenPressed = true;					
					
					allTerrainsFilled = true;
					for(y = 0; y < terrainSelections.Length; y++)
					{
						if(terrainSelections[y] == null)
							allTerrainsFilled = false;
					}
					
					if(allTerrainsFilled)
					{
						Blend();
						this.Close();
					}
					else
					{
						this.ShowNotification(GUIContent("All terrain fields must be filled before blending can proceed."));
						GUIUtility.keyboardControl = 0; // Added to shift focus to original window rather than the notification
						beenPressed = false;
					}
				}
				else
				{
					this.ShowNotification(GUIContent("Blending in process . . ."));
					GUIUtility.keyboardControl = 0; // Added to shift focus to original window rather than the notification
				}
			}
		}
		else
				EditorGUILayout.LabelField("The Blending Tool cannot operate in play mode. Exit play mode and reselect Terrain Blending option from Terrain menu.");

				
	}//End the OnGUI function
	
	function FillSelections()
	{

        selections = GameObject.FindObjectsOfType(typeof(Terrain));

		if(selections.Length < terrainsWide*terrainsLong)
		{
			this.ShowNotification(GUIContent("The number of terrain objects in the scene is less than the number of terrains expected (Terrains Wide x Terrains Long."));
			GUIUtility.keyboardControl = 0; // Added to shift focus to original window rather than the notification
		}
		
		else
		{
			terrains = new Terrain[terrainsWide*terrainsLong];
			
			//The starting x and z of the first terrain. We will need to reference this position several times.
			var startingX : float = baseTerrain.transform.position.x;
			var startingZ : float = baseTerrain.transform.position.z;
			
			var xPos : float;
			var zPos : float;
			var yPos : float = baseTerrain.transform.position.y;	
			
			
			arrayPos = 0;
			
			for(y = 0; y < terrainsLong ; y++)
			{
				if(y == 0)
					zPos = startingZ;
				else 
					zPos += terrains[arrayPos - terrainsWide].terrainData.size.z;
						
				for(x = 0; x < terrainsWide ; x++)
				{
					if(x == 0)
						xPos = startingX;
					else
						xPos += terrains[arrayPos - 1].terrainData.size.x;
						
					for(i = 0; i < selections.Length ; i++)
					{
						if(Mathf.Approximately(selections[i].GetPosition().x, xPos) && Mathf.Approximately(selections[i].GetPosition().z, zPos) && Mathf.Approximately(selections[i].GetPosition().y, yPos))
						{
							terrains[arrayPos] = selections[i];
							i = selections.Length;
						}
					}
					arrayPos++;
		
				}//End the x loop
			}//End the y loop
			
			for(i = 0; i < terrains.Length; i++)
					terrainSelections[i] = terrains[i];

			System.Array.Clear(selections, 0, selections.Length);
			System.Array.Clear(terrains, 0, terrains.Length);
		}
	}
	
	function Blend()
	{
		
		data = new TerrainData[terrainSelections.Length];
		for(i = 0; i < terrainSelections.Length; i++)
			data[i] = terrainSelections[i].terrainData;
		
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
			arrayPos = -3;
			for(z = 0; z < terrainsLong - 1; z++)
			{
				arrayPos += 2;
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
				}
			}
		}
		
	}
	
}//End the MakeTerrain Class