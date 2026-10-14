import sarahAsset from '../assets/sarah.webp'
import jasonAsset from '../assets/jason.webp'
import ryanAsset from '../assets/ryan.webp'
import cathyAsset from '../assets/cathy.webp'
import dailyAsset from '../assets/daily.webp'
import restaurantAsset from '../assets/restaurant.webp'
import phoneAsset from '../assets/phone.webp'
import taxiAsset from '../assets/taxi.webp'
import photoAsset from '../assets/photo.webp'
import metroAsset from '../assets/metro.webp'
import luggageAsset from '../assets/luggage.webp'
import directionsAsset from '../assets/directions.webp'

const sarah: string = sarahAsset.src
const jason: string = jasonAsset.src
const ryan: string = ryanAsset.src
const cathy: string = cathyAsset.src
const daily: string = dailyAsset.src
const restaurant: string = restaurantAsset.src
const phone: string = phoneAsset.src
const taxi: string = taxiAsset.src
const photo: string = photoAsset.src
const metro: string = metroAsset.src
const luggage: string = luggageAsset.src
const directions: string = directionsAsset.src

import { mentors as mentorData, scenes as sceneData } from './catalog-data'
const mentorImages = { sarah, jason, ryan, 'sarah-british': cathy }
const sceneImages = { daily, restaurant, phone, taxi, photo, metro, luggage, directions }
export const mentors = mentorData.map((mentor) => ({ ...mentor, image: mentorImages[mentor.id] }))
export const scenes = sceneData.map((scene) => ({ ...scene, image: sceneImages[scene.id] }))
