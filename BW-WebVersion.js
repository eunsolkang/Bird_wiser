window.addEventListener("load", update, false);
window.addEventListener("keydown", onKeyDown, false);
//window.addEventListener("drag" getCalendar, false);
var Event = [];
var newNum = 0;
var time = new Date();
var nowTime = new Date();
time.setDate(1);
var lastDate = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var weekend = ["Sun","Mon","Tue", "Wen", "Thu", "Fri", "Sat"];
var nowYear = time.getFullYear();
var nowMonth = time.getMonth();
var t = "";
var week = Math.ceil((time.getDate() + lastDate[time.getMonth()]) / 7); 
var dateNum;
var check = 0;


function getEvent(day)
{
	Event[Event.length] = new getDateEvent(day)
	update();
}
function getDateEvent(day)
{
	this.eventValue = prompt("ADD EVENT");
	this.Year = time.getFullYear();
	this.Month = time.getMonth() +1;
	this.eventDay = day;
}

function onKeyDown(e)
{
	switch(e.keyCode)
	{
		case 37: 
			update(-1);
			break;
		case 39: 
			update(1);
			break;
	}
}
function update(next) 
{
	t = "";
	/*년도 계산*/
	if (next == 1)
	{
		if (nowMonth != 12)
		{
			time.setMonth(nowMonth += 1);
		}
		else{
			time.setFullYear(nowYear += 1)
			nowMonth = 1
			time.setMonth(nowMonth += 1)
		}
	} 
	else if (next == -1)
	{
		if (nowMonth != 1)
		{
			time.setMonth(nowMonth -= 1);
		}
		else{
			time.setFullYear(nowYear -= 1)
			nowMonth = 12
			time.setMonth(nowMonth -= 1)
		}
	}
	else{
		time.setMonth(nowMonth);
	}

	/*윤달 계산*/
	if( (nowYear % 4 == 0 && nowYear % 100 != 0) || nowYear % 400 == 0 )	lastDate[1] = 29; 
	else lastDate[1] = 28;


	t += "<table id='table_1'>"
	t += "<tr>"
	t += "  <th></th>"
	t += "	<th colspan='5'>"+time.getFullYear()+"년"+(time.getMonth()+1)+"월"+"</th>"
	t += "  <th></th>"
	t += "</tr>"

	t += "<tr>"
	for (var i=0; i<7; i++)
	{
		t += "<th class='"+weekend[i]+"'>"+weekend[i]+"</th>";
	}
	t += "</tr>"
	dateNum = 1 - time.getDay();
	for (var i=0; i <= week ; i++)
	{
		t += "<tr>";
		for (var j=0; j<7; dateNum++, j++)
		{
			if (dateNum < 1 || dateNum > lastDate[time.getMonth()])
			{
				t += "<td class='"+weekend[j]+"'></td>";
				continue;
			}
			if(dateNum == nowTime.getDate() && nowMonth == nowTime.getMonth())
			{
				t += "<td id='toDay' ondblclick='getEvent("+dateNum+")'>"+dateNum+"</td></br>";
			}
			else{
				t += "<td class='"+weekend[j]+"' ondblclick='getEvent("+dateNum+")'>"+dateNum;
				for (k=0; k<Event.length; k++)
				{
					if(nowMonth + 1 == Event[k].Month && Event[k].eventValue != undefined && Event[k].eventDay == dateNum && Event[k].Year == nowYear)
					{
						t += "<div draggable='true'>"+Event[k].eventValue+"</div>"
					}
				}
				t += "</td>"
			}
		}
		t += "</tr>"
	}
	t += "</table>"
	
	/*최종 출력*/
	document.getElementById('Table').innerHTML = t;
}