"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AddItemStepBasic } from "@/components/items/add-item-step-basic"
import { AddItemStepPricing } from "@/components/items/add-item-step-pricing"
import { AddItemStepDetails } from "@/components/items/add-item-step-details"
import { AddItemStepReview } from "@/components/items/add-item-step-review"
import { useToast } from "@/hooks/use-toast"
import { itemService } from "@/lib/services/item.service"

const steps = [
  { id: 1, title: "Asosiy ma'lumotlar", description: "Kategoriya, model, og'irlik" },
  { id: 2, title: "Narxlash", description: "Lom narxi, mehnat haqi, foyda" },
  { id: 3, title: "Qo'shimcha ma'lumotlar", description: "Rang, tozalik, toshlar" },
  { id: 4, title: "Ko'rib chiqish", description: "Tasdiqlash va yuborish" },
]

export function AddItemWizard() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Basic info defaults
    model: "",
    category: "" as "Uzuk" | "Sirg'a" | "Bilakuzuk" | "Zanjir" | "Boshqa" | "",
    weight: 0,
    size: undefined as number | undefined,
    quantity: 1,
    purchaseDate: new Date().toISOString().split("T")[0],
    isProvider: false,
    branch: "",
    branchName: "",
    distributedDate: "",
    supplierName: "",
    paymentStatus: "unpaid" as const,

    // Pricing defaults
    lomNarxi: 800000,
    lomNarxiKirim: 850000,
    laborCost: 70000,
    profitPercentage: 20,
    payedLomNarxi: undefined as number | undefined,

    // Details defaults
    color: "",
    purity: "" as "14K" | "18K" | "21K" | "22K" | "24K" | "",
    stoneType: "",
    stoneWeight: undefined as number | undefined,
    manufacturer: "",
    notes: "",
  })

  const progress = (currentStep / steps.length) * 100

  const handleNext = (data: any) => {
    console.log("Step data received:", data)
    setFormData((prev) => ({ ...prev, ...data }))
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      console.log("Submitting form data:", formData)

      // Validate required fields
      if (!formData.category) {
        throw new Error("Kategoriya tanlanmagan")
      }
      if (!formData.model.trim()) {
        throw new Error("Model kiritilmagan")
      }
      if (!formData.isProvider && !formData.branch) {
        throw new Error("Filial tanlanmagan")
      }

      await itemService.createItem(formData)

      toast({
        title: "Muvaffaqiyatli saqlandi",
        description: "Mahsulot muvaffaqiyatli qo'shildi",
      })

      // Reset form and go back to step 1
      setFormData({
        model: "",
        category: "",
        weight: 0,
        size: undefined,
        quantity: 1,
        purchaseDate: new Date().toISOString().split("T")[0],
        isProvider: false,
        branch: "",
        branchName: "",
        distributedDate: "",
        supplierName: "",
        paymentStatus: "unpaid",
        lomNarxi: 800000,
        lomNarxiKirim: 850000,
        laborCost: 70000,
        profitPercentage: 20,
        payedLomNarxi: undefined,
        color: "",
        purity: "",
        stoneType: "",
        stoneWeight: undefined,
        manufacturer: "",
        notes: "",
      })
      setCurrentStep(1)
    } catch (error: any) {
      console.error("Error saving item:", error)
      toast({
        title: "Xatolik",
        description: error.message || "Mahsulotni saqlashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AddItemStepBasic onNext={handleNext} initialData={formData} />
      case 2:
        return <AddItemStepPricing onNext={handleNext} onPrevious={handlePrevious} initialData={formData} />
      case 3:
        return <AddItemStepDetails onNext={handleNext} onPrevious={handlePrevious} initialData={formData} />
      case 4:
        return (
          <AddItemStepReview
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            formData={formData}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Qadam {currentStep} / {steps.length}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Bajarildi</span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`text-center p-4 border-b-2 rounded-lg ${
              step.id === currentStep
                ? "border-primary text-primary bg-primary/5"
                : step.id < currentStep
                  ? "border-green-500 text-green-500 bg-green-50"
                  : "border-muted text-muted-foreground bg-muted/20"
            }`}
          >
            <div className="font-medium text-sm">{step.title}</div>
            <div className="text-xs mt-1">{step.description}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div>{renderStep()}</div>
    </div>
  )
}
