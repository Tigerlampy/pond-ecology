import { generateStoragePath, getPublicUrl } from '@/lib/storage'

describe('generateStoragePath', () => {
  it('userId와 파일명으로 경로 생성', () => {
    const path = generateStoragePath('user123', 'photo.jpg')
    expect(path).toMatch(/^user123\/\d+_photo\.jpg$/)
  })

  it('파일명 특수문자 sanitize', () => {
    const path = generateStoragePath('user1', 'my photo!.jpg')
    expect(path).toMatch(/^user1\/\d+_my_photo_\.jpg$/)
  })
})

describe('getPublicUrl', () => {
  it('bucket과 path로 URL 문자열 반환', () => {
    const url = getPublicUrl('species-images', 'user123/photo.jpg')
    expect(typeof url).toBe('string')
    expect(url.length).toBeGreaterThan(0)
  })
})
