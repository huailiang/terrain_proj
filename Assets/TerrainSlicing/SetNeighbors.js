//Terrain Slicing & Neighboring Kit v1.2 copyright © 2013 Kyle Gillen. All rights reserved. Redistribution is not allowed.

#pragma strict

private var x : int;
private var y : int;
private var i : int;

var terrainsWide : int = 2;
var terrainsLong : int = 2;

private var arrayPos : int;

var terrains : Terrain[];

var showFoldout : boolean = true;

private var allTerrainsFilled : boolean;
function Start()
{
	if(!SetTheNeighbors())
		Debug.Log("Set Neighbors Failed.");
}
	


function SetTheNeighbors() : boolean
{
	allTerrainsFilled = true;
	for(y = 0; y < terrains.Length; y++)
	{
		if(terrains[y] == null)
			allTerrainsFilled = false;
	}

	if(!allTerrainsFilled)
	{
		Debug.Log("Number of terrains selected does not match expected number of terrains (Terrains Wide x Terrains Long.");
		return false;
	}
	else
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
				arrayPos++;
		
			}//End the x for loop	
		}//End the y for loop
	
		for(i = 0; i < terrainsWide*terrainsLong ; i++)
			terrains[i].Flush();
			
		return true;
	}
}
