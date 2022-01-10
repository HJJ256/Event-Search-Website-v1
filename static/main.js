var lat_long;
function geosearch(){
    var request = new XMLHttpRequest();
    request.open('GET','https://ipinfo.io?token=333e0cd1d96882',true)
    request.onload = function(){
        var data = JSON.parse(this.response)
        if (request.status >= 200 && request.status<=400){
            lat_long = data.loc;
            console.log(lat_long);
            document.getElementById("submit").disabled = false;
        }
    };
    request.send();
    //document.getElementById("submit").disabled = false;
}

function resetForm(){
    document.getElementById('search_form').reset();
    var txtLocation = document.getElementById("txtloc");
    txtLocation.disabled = true;
    var search_table = document.getElementById('search_table');
    var detail_section = document.getElementById('detail_section');
    search_table.innerHTML  = '';
    detail_section.innerHTML = '';
}

function EnableDisableTextBox() {
    var chkLocation = document.getElementById("loc");
    var txtLocation = document.getElementById("txtloc");
    txtLocation.disabled = chkLocation.checked ? false : true;
    if (!txtLocation.disabled) {
        txtLocation.focus();
    }
}

function generateTableHead(table){
    let tableHead = table.createTHead();
    let row = tableHead.insertRow();

    let th = document.createElement("th");
    let text = document.createTextNode('Date');
    th.appendChild(text);
    row.appendChild(th);
    
    th = document.createElement("th");
    text = document.createTextNode('Icon');
    th.appendChild(text);
    row.appendChild(th);

    th = document.createElement("th");
    text = document.createTextNode('Event');
    th.appendChild(text);
    row.appendChild(th);

    th = document.createElement("th");
    text = document.createTextNode('Genre');
    th.appendChild(text);
    row.appendChild(th);

    th = document.createElement("th");
    text = document.createTextNode('Venue');
    th.appendChild(text);
    row.appendChild(th);
}

function generateTable(table,data){
    for (let item in data){
        let row = table.insertRow();
        let td = row.insertCell();
        
        let text = document.createTextNode(data[item]['Date']);
        let text2 = document.createTextNode(' ' + data[item]['Time']);
        td.style = "text-align:center;"
        td.appendChild(text);
        td.appendChild(text2);
        
        td = row.insertCell();
        td.align = 'center';
        let icon = document.createElement('img');
        icon.src = data[item]['Icon'];
        icon.height = '30'
        td.appendChild(icon)
        
        td = row.insertCell();
        text = document.createTextNode(data[item]['Event']);
        let para = document.createElement('a');
        para.href = '#detail_section';
        para.id = data[item]['id'];
        para.appendChild(text);
        para.onclick = e => {
            getEventDetails(e.target.id);
        }
        td.appendChild(para);

        td = row.insertCell();
        text = document.createTextNode(data[item]['Genre']);
        td.appendChild(text);

        td = row.insertCell();
        text = document.createTextNode(data[item]['Venue']);
        td.appendChild(text);
    }
}

function callSearch(keyword,location,distance,category,noresults){
    if(noresults){
        var search_table = document.getElementById('search_table');
            var detail_section = document.getElementById('detail_section');
            search_table.innerHTML  = '';
            detail_section.innerHTML = '';
            var txt = document.createTextNode('No Records have been found');
            search_table.appendChild(txt);
            search_table.style.backgroundColor = 'lightgray';
    }
    else{
        var url = '/search?keyword='+keyword+'&geoPoint='+location+'&radius='+distance+'&segmentId='+category
    //console.log(url)
    var request = new XMLHttpRequest();
    request.open('GET',url,true);
    request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
    request.onload = function(){
        var data = JSON.parse(this.response);
        if ('error_message' in data){
            var search_table = document.getElementById('search_table');
            var detail_section = document.getElementById('detail_section');
            search_table.innerHTML  = '';
            detail_section.innerHTML = '';
            var txt = document.createTextNode(data['error_message']);
            search_table.appendChild(txt);
            search_table.style.backgroundColor = 'lightgray';
        }
        else{
            //console.log(data);
            let table = document.createElement('table');
            table.style = "align-self:center;";
            generateTableHead(table);
            generateTable(table,data);
            var search_table = document.getElementById('search_table');
            var detail_section = document.getElementById('detail_section');
            search_table.innerHTML  = '';
            detail_section.innerHTML = '';
            search_table.appendChild(table);
            search_table.style.backgroundColor = 'white';
        }
    }
    request.send();
    }
}

function getEvents() {
    var keyword = document.getElementById('keyword').value;
    //console.log(keyword);
    var distance = document.getElementById('distance').value;
    if (distance=='' || distance==null){
        distance = '10';
    }
    var categoryBox = document.getElementById('category');
    var category = categoryBox.options[categoryBox.selectedIndex].value;
    var from = document.getElementById('loc').checked;
    if (!from){
        //console.log(lat_long)
        var location = lat_long; //geohashed in python
        callSearch(keyword,location,distance,category,false);
    }
    else{
        var loctxt = document.getElementById('txtloc').value;
        //console.log(loctxt);
        var geokey = 'AIzaSyAQuwS1FuP95xMXOtDLW841gsw6f_7DAr8';
        var loc_url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + loctxt + '&key='+ geokey; 
        //console.log(loc_url);
        fetch(loc_url)
            .then(response => response.json())
            .then(y => y['results'][0]['geometry']['location'])
            .then(z => (z['lat'] + ',' + z['lng']))
            .then(w => {
                callSearch(keyword,w,distance,category,false);
            })
            .catch(error => {
                callSearch(keyword,lat_long,distance,category,true)
            })
    }
}

function generateDetailsDiv(data){
    let div0 = document.createElement('div');
    div0.style = "grid-column-start: 1; grid-column-end: 3;";
    let div1 = document.createElement('div');
    div1.style = "justify-self:end;";
    let div2 = document.createElement('div');
    div2.style = "";

    keys  = ['Date','Artist/Team','Venue','Genres','Price Ranges','Ticket Status','Buy Ticket At:','Seat Map'];

    let h1 = document.createElement('h2');
    h1.style = "text-align:center;"
    let title = document.createTextNode(data['Event']);
    h1.appendChild(title);
    div0.appendChild(h1);
    for(let key in keys){
        if (keys[key] == 'Seat Map'){
            if(keys[key] in data){
                if (data[keys[key]] != 'N/A'){
                    let img = document.createElement('img');
                    img.src = data[keys[key]];
                    img.height = '500';
                    div2.appendChild(img);
                }    
            }
        }
        else if (keys[key] == 'Buy Ticket At:'){
            if(keys[key] in data){
                if (data[keys[key]] != 'N/A'){
                    let h2 = document.createElement('h2');
                    let heading = document.createTextNode(keys[key]);
                    h2.appendChild(heading);
                    h2.style = "margin-bottom:1px;";
                    let a = document.createElement('a');
                    a.href = data[keys[key]]
                    a.target = '_blank'
                    let text = document.createTextNode('Ticketmaster')
                    a.appendChild(text);
                    div1.appendChild(h2);
                    div1.appendChild(a);
                }    
            }
        }
        else if (keys[key] == 'Artist/Team'){
            if(keys[key] in data){
                let h2 = document.createElement('h2');
                let heading = document.createTextNode(keys[key]);
                h2.appendChild(heading);
                div1.appendChild(h2);
                h2.style = "margin-bottom:1px;";
                for (let i in data[keys[key]]){
                    let a = document.createElement('a');
                    a.href = data['attr_urls'][i]
                    a.target = '_blank'
                    let text = document.createTextNode(data[keys[key]][i])
                    a.appendChild(text);
                    div1.appendChild(a);
                    if (i!=data[keys[key]].length-1){
                        let text = document.createTextNode(' | ')
                        div1.appendChild(text)
                    }
                }    
            }
        }
        else if (keys[key] in data){
            if (data[keys[key]] != 'N/A'){
                //console.log(key)
                let h2 = document.createElement('h2');
                h2.style = "margin-bottom:1px;";
                let heading = document.createTextNode(keys[key]);
                h2.appendChild(heading);
                let text = document.createTextNode(data[keys[key]]);
                div1.appendChild(h2);
                div1.appendChild(text);
            }
        }
    }

    return [div0,div1,div2] 

}

function getEventDetails(event_id){
    var url = '/details/'+event_id
    //console.log(event_id);
    var request = new XMLHttpRequest();
    request.open('GET',url,true);
    request.setRequestHeader('content-type', 'application/json;charset=UTF-8');
    request.onload = function(){
        var data = JSON.parse(this.response);
        //console.log(data);
        let div = document.getElementById('detail_section');
        let divs = generateDetailsDiv(data);
        let div0 = divs[0]
        let div1 = divs[1];
        let div2 = divs[2];
        div.innerHTML = '';
        div.appendChild(div0)
        div.appendChild(div1);
        div.appendChild(div2);
        div.scrollIntoView(false);
    }
    request.send()

}