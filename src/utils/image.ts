import { seafoodImages, seafoodNames } from '@/data/mock'

export const getSeafoodImage = (index: number): string => {
  return seafoodImages[index % seafoodImages.length]
}

export const getSeafoodImageById = (id: string | number): string => {
  const num = typeof id === 'string' ? parseInt(id) || 0 : id
  return seafoodImages[num % seafoodImages.length]
}

export const getSeafoodName = (index: number): string => {
  return seafoodNames[index % seafoodNames.length]
}

export const getSeafoodNameById = (id: string | number): string => {
  const num = typeof id === 'string' ? parseInt(id) || 0 : id
  return seafoodNames[num % seafoodNames.length]
}
