import Footer from '@/components/Footer'
import Header from '@/components/layouts/Header'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { File } from 'lucide-react'
import React from 'react'

const page = () => {
  return (
    <div>
      <Header />


 <Empty className="bg-muted/30">
      <EmptyHeader>
        <EmptyMedia variant="icon" >
          <File />
        </EmptyMedia>
        <EmptyTitle>رزروهای من</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          شما رزروری انجام نداده اید
        </EmptyDescription>
      </EmptyHeader>

    </Empty>


      <Footer />
    </div>
  )
}

export default page
