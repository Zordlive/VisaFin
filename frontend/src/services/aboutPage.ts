import api from './api'

export interface AboutPage {
  id?: number
  title: string
  subtitle: string
  historique: string
  mission: string
  vision: string
  values: string
  founded_year: number | null
  headquarters: string
  contact_email: string
  contact_phone: string
  image?: string | null
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

const emptyAbout: AboutPage = {
  title: '',
  subtitle: '',
  historique: '',
  mission: '',
  vision: '',
  values: '',
  founded_year: null,
  headquarters: '',
  contact_email: '',
  contact_phone: '',
  image: null,
  image_url: null,
}

export async function getAboutPage(): Promise<AboutPage> {
  try {
    const resp = await api.get<AboutPage>('/about-page')
    return resp.data || emptyAbout
  } catch (e) {
    return emptyAbout
  }
}

export async function updateAboutPage(
  id: number,
  payload: Partial<AboutPage>,
  imageFile?: File | null
): Promise<AboutPage> {
  const hasFile = Boolean(imageFile)
  const url = `/about-page/${id}`
  if (!hasFile) {
    const resp = await api.patch<AboutPage>(url, payload)
    return resp.data
  }

  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.append(key, String(value))
  })
  if (imageFile) form.append('image', imageFile)

  const resp = await api.patch<AboutPage>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}
