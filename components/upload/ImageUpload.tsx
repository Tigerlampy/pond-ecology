'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  onFileSelect: (file: File) => void
  previewUrl?: string | null
}

export default function ImageUpload({ onFileSelect, previewUrl }: Props) {
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = previewUrl ?? localPreview

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setLocalPreview(url)
    onFileSelect(file)
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      {preview ? (
        <div className="relative h-48">
          <Image src={preview} alt="미리보기" fill className="object-contain" />
        </div>
      ) : (
        <div className="py-8">
          <p className="text-4xl mb-2">📷</p>
          <p className="text-gray-500 text-sm">클릭해서 사진 선택 (JPG, PNG)</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
