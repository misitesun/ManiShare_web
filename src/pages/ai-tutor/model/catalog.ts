import sarah from '../assets/sarah.webp'
import jason from '../assets/jason.webp'
import ryan from '../assets/ryan.webp'
import sarahBritish from '../assets/sarah-british.webp'
import daily from '../assets/daily.webp'
import restaurant from '../assets/restaurant.webp'
import phone from '../assets/phone.webp'
import taxi from '../assets/taxi.webp'
import photo from '../assets/photo.webp'
import metro from '../assets/metro.webp'
import luggage from '../assets/luggage.webp'
import directions from '../assets/directions.webp'

export const mentors = [
    { id: 'sarah', name: 'Sarah', voice: '美式女音', accent: 'american', image: sarah },
    { id: 'jason', name: 'Jason', voice: '美式女音', accent: 'american', image: jason },
    { id: 'ryan', name: 'Ryan', voice: '英式男音', accent: 'british', image: ryan },
    {
        id: 'sarah-british',
        name: 'Sarah',
        voice: '英式男音',
        accent: 'british',
        image: sarahBritish,
    },
] as const

export const scenes = [
    { id: 'daily', label: '日常闲聊', image: daily },
    { id: 'restaurant', label: '餐厅点餐', image: restaurant },
    { id: 'phone', label: '电话预约', image: phone },
    { id: 'taxi', label: '打车出行', image: taxi },
    { id: 'photo', label: '旅游拍照', image: photo },
    { id: 'metro', label: '地铁购票', image: metro },
    { id: 'luggage', label: '行李丢失', image: luggage },
    { id: 'directions', label: '旅行问路', image: directions },
] as const
