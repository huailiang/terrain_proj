//Terrain Slicing & Neighboring Kit v1.2 copyright © 2013 Kyle Gillen. All rights reserved. Redistribution is not allowed.

@CustomEditor(SetNeighbors)

class SetNeighborsEditor extends Editor
{
	var tempArray : Terrain[];
	
	var selections : Terrain[];
	var terrains : Terrain[];
	
	var x : int;
	var y : int;;
	var t : int;
	
	var allSelectionsAreTerrains : boolean;
	
	var startingX : float;
	var startingZ : float;
	var xPos : float;
	var zPos : float;
	var yPos : float;
	var arrayPos : int;
	
	var terrainsWide : int;
	var terrainsLong : int;
	
	var label2 : GUIContent;
	var label3 : GUIContent;
	var label4 : GUIContent;
		
	var justStarted : boolean = true;
	
	function OnInspectorGUI()
	{
		if(justStarted)
		{
			EditorUtility.SetDirty(target);
			//If there are no terrains in the SetNeighbors script we need to create the array to hold our terrains. Otherwise leave the already existing
			//terrains array alone
			if(target.terrains == null)
				target.terrains = new Terrain[target.terrainsWide*target.terrainsLong];
				
			label2 = new GUIContent("Terrains Wide", "This value represents the number of terrains that exist in a single row (along x axis) of your terrain group.");
	    	label3 = new GUIContent("Terrains Tall", "This value represents the number of terrains that exist in a single column (along z axis) of your terrain group.");
	    	label4 = new GUIContent("Terrains in Group", "Fill the fields below with all the terrains in your terrain group, starting with the first terrain, and preceding in order from left to right, then bottom to top.\n\n" +
	    	"Press the 'Auto Fill From Scene' button to have the script try and automatically fill these fields in for you.");
	    	
			justStarted = false;
		}
		
		target.terrainsWide = EditorGUILayout.IntField(label2, target.terrainsWide);
		target.terrainsLong = EditorGUILayout.IntField(label3, target.terrainsLong);
		
		target.showFoldout = EditorGUILayout.Foldout(target.showFoldout, label4);
		
		if(target.showFoldout)
		{
			if(GUILayout.Button("Auto Fill From Scene"))
				FillSelections();
			
			if(target.terrains.Length != target.terrainsWide*target.terrainsLong)
			{
				tempArray = new Terrain[target.terrainsWide*target.terrainsLong];
				for(t = 0; t < target.terrainsWide*target.terrainsLong ; t++)
					if(target.terrains.Length > t)
						tempArray[t] = target.terrains[t];
				
				target.terrains = tempArray;
			}
			for(t = 0; t < target.terrains.Length; t++)
				target.terrains[t] = EditorGUILayout.ObjectField ("Terrain " + t, target.terrains[t], Terrain, true) as Terrain;
		}
		
		if(GUI.changed)
			EditorUtility.SetDirty(target);
	}
	
	function FillSelections()
	{

		selections = GameObject.FindSceneObjectsOfType(typeof(Terrain));

		if(selections.Length < target.terrainsWide*target.terrainsLong)
			Debug.Log("The number of terrain objects in the scene is less than the number of terrains expected (Terrains Wide x Terrains Long.\n"
			+ "Adjust the number of terrains wide or terrains long value to reduce the number of expected terrains.");
		
		else
		{
			terrainsLong = target.terrainsLong;
			terrainsWide = target.terrainsWide;
			//This array will store the terrains in order. Each index will hold a int that references a position in the selections array.
			//For instance, our bottom left terrain might be stored anywhere in the selections array. Shortly, we will seek to find it, and when we do
			//we want to know where in the selections array this object exist. We will store this reference in the 0th index of the arrayPositions array, and so on...
			terrains = new Terrain[terrainsWide*terrainsLong];
			
			//The starting x and z of the first terrain. We will need to reference this position several times.
			startingX = target.transform.position.x;
			startingZ = target.transform.position.z;
			
			//yPos will never change since all terrains must be at the same y position.
			yPos = target.transform.position.y;	
			//Starting at pos x=0, z=0 (or whatever starting position is entered by the user), we want to find the terrain that matches
			//this position, store it in the terrains array at position 0, and then find the next terrain in the scene. A triple for loop 
			//will allow us to do this.
			
			//The purpose of this is we need to store the terrains in a specific order for the setting of the neighbors to work
			arrayPos = 0;
			
			for(y = 0; y < terrainsLong ; y++)
			{
				if(y == 0) //If y = 0, set zPos to the startingZ entered by the user
					zPos = startingZ;
				//If y is not 0, the yPos is equal to current yPos + terrain Height of the terrain 
				//below this terrain (which is arrayPos - terrainsWide)
				else 
					zPos += terrains[arrayPos - terrainsWide].terrainData.size.z;
						
				for(x = 0; x < terrainsWide ; x++)
				{
					//if x is equal to 0 then we know this terrain is the first in the row, and thus xPos should be reset to startinX.
					//if it's not equal to 0 then xPos should be set to
					//current xPos + the width of the previous terrain
					if(x == 0)
						xPos = startingX;
					else
						xPos += terrains[arrayPos - 1].terrainData.size.x;
						
					//This for loop loops through the selection of game objects to find the correct terrain
					for(t = 0; t < selections.Length ; t++)
					{
						if(Mathf.Approximately(selections[t].GetPosition().x, xPos) && Mathf.Approximately(selections[t].GetPosition().z, zPos) && Mathf.Approximately(selections[t].GetPosition().y, yPos))
						{
							terrains[arrayPos] = selections[t];
		
										
							//We need to exit from the i for loop now, which we'll do by setting i = selections.Length
							t = selections.Length;
						}
					}
					//Increment the arrayPos
					arrayPos++;
					
					//Increment progress
		
				}//End the x loop
			}//End the y loop
			
			for(t = 0; t < terrains.Length; t++)
				target.terrains[t] = terrains[t];
			//Since we can set multiple terrains without closing the window, we must clear our arrays for the next go around
			System.Array.Clear(selections, 0, selections.Length);
			System.Array.Clear(terrains, 0, terrains.Length);
		}
		
	}
	function OnDestroy()
	{
		justStarting = false;
	}
}

