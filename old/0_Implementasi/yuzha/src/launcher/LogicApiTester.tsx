import React from 'react'

export type LogicApiTesterProps = {
  visible: boolean
}

export default function LogicApiTester(props: LogicApiTesterProps) {
  if (!props.visible) return null
  return (
    <div className="launcher-api-tester">
      Supabase API tester dinonaktifkan. Gunakan data lokal untuk verifikasi.
    </div>
  )
}
