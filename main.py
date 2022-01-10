import re
from flask import Flask, jsonify, request
from flask.templating import render_template
from flask_cors import CORS
import requests
from geolib import geohash

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__)
CORS(app)
API_KEY = "Uced0mO1FoidmwDugkEyGileAFxy90Tu"

@app.route('/')
def root():
    return app.send_static_file('event.html')

def construct_event_dict(event):
    event_dict = {}
    event_dict['id'] = event.get('id','')
    dates = event.get('dates','N/A')
    if dates != 'N/A':
        event_dict['Date'] = dates['start'].get('localDate','TBD')
        event_dict['Time'] = dates['start'].get('localTime','')
    else:
        event_dict['Date'] = 'N/A'

    final_image = {'url':''}
    images = event.get('images','N/A')
    if images != 'N/A':
        for image in images:
            if image['ratio'] == '3_2':
                final_image = image
                break
            elif image['ratio'] == '4_3':
                final_image = image
            else:
                final_image = image

    event_dict['Icon'] = final_image['url']
    event_dict['Event'] = event['name']
    genres = ''
    classifications = event.get('classifications','N/A')
    if classifications != 'N/A':
        for classification in classifications:
            genres+=classification['segment']['name']
            genres+=','
    genres = genres[:-1]
    event_dict['Genre'] = genres

    embedded = event.get('_embedded','N/A')
    venue='N/A'
    if embedded != 'N/A':
        venue = embedded.get('venues','N/A')

    if venue != 'N/A':
        venue = venue[0].get('name','N/A')

    event_dict['Venue'] = venue
    return event_dict

@app.route('/search')
def search():
    """Return search result."""
    args_dict = {}
    args_dict['keyword'] = request.args.get('keyword')
    args_dict['geoPoint'] = request.args.get('geoPoint')
    args_dict['radius'] = request.args.get('radius')
    args_dict['segmentId'] = request.args.get('segmentId')
    #print(args_dict['geoPoint'])
    lat,loc = args_dict['geoPoint'].split(',')
    loc_hash = geohash.encode(lat,loc,7)
    args_dict['geoPoint'] = loc_hash
    #segment_id = {"Music":"KZFzniwnSyZfZ7v7nJ","Sports":"KZFzniwnSyZfZ7v7nE",
    #            "Arts & Theatre":"KZFzniwnSyZfZ7v7na","Film":"KZFzniwnSyZfZ7v7nn",
    #            "Miscellaneous":"KZFzniwnSyZfZ7v7n1"
    #            }
    url = 'https://app.ticketmaster.com/discovery/v2/events.json?unit=miles&apikey={}'.format(API_KEY)
    for key in args_dict:
        if args_dict[key]:
            print(key,args_dict[key])
            url += '&{}={}'.format(key,args_dict[key])
        else:
            pass
            #print(key,args_dict[key])

    results = requests.get(url)
    res_dict = results.json()
    if '_embedded' in res_dict:
        events = res_dict['_embedded']['events']
        req_event_data = []
        for event in events:
            event_dict = construct_event_dict(event)
            req_event_data.append(event_dict)
        return jsonify(req_event_data)
    else:
        return jsonify({'error_message':'No Records have been found'})

def construct_details_dict(event):
    event_dict = {}
    
    event_dict['Event'] = event['name']
    dates = event.get('dates','N/A')
    if dates != 'N/A':
        event_dict['Date'] = dates['start'].get('localDate','TBD') + ' ' + dates['start'].get('localTime','')

    attractions = []
    attractions_url =[]
    embedded = event.get('_embedded','N/A')
    attrs = 'N/A'
    if embedded!='N/A':
        attrs = embedded.get('attractions','N/A')
    
    if attrs != 'N/A':
        for attraction in attrs:
            attractions.append(attraction.get('name','N/A'))
            attractions_url.append(attraction.get('url',''))
        event_dict['Artist/Team'] = attractions
        event_dict['attr_urls'] = attractions_url

    
    venue='N/A'
    if embedded != 'N/A':
        venue = embedded.get('venues','N/A')

    if venue != 'N/A':
        venue = venue[0].get('name','N/A')

    event_dict['Venue'] = venue

    genres = []
    classifications = event.get('classifications','N/A')
    if classifications!='N/A':
        for classification in classifications:
            for key in ['genre','subGenre','segment','subType','type']:
                if key in classification:
                    if 'name' in classification[key]: 
                        genres.append(classification[key]['name'])
    
    genres = list(set(genres))
    while 'Undefined' in genres:
        genres.remove('Undefined')
    if genres == []:
        genres = ['N/A']
    event_dict['Genres'] = ' | '.join(genres)

    priceranges = event.get('priceRanges','N/A') 
    if priceranges!='N/A':
        min_range = priceranges[0]['min']
        max_range = priceranges[0]['max']
        if min_range - int(min_range) == 0:
            min_range = int(min_range)
        if max_range - int(max_range) == 0:
            max_range = int(max_range)
        event_dict['Price Ranges'] = str(min_range) + ' - ' + str(max_range) + ' ' + str(priceranges[0]['currency'])

    if dates!='N/A':
        event_dict['Ticket Status'] = dates['status']['code']

    event_dict['Buy Ticket At:'] = event.get('url','N/A')

    seatmap = event.get('seatmap','N/A')
    if seatmap != 'N/A':
        event_dict['Seat Map'] = seatmap.get('staticUrl','N/A')
    
    return event_dict

@app.route('/details/<event_id>')
def details(event_id=None):
    """Return event details."""
    
    results = requests.get('https://app.ticketmaster.com/discovery/v2/events/{}.json?apikey={}'.format(event_id,API_KEY))

    event_dict = construct_details_dict(results.json())
    
    return jsonify(event_dict)

@app.route('/test/<number>')
def test(number=None):
    results = jsonify({"number":number})

    return results

if __name__ == '__main__':
    app.run()