'use client';

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Progress } from "@nextui-org/progress";
import { Image } from "@nextui-org/image";
import { Chip } from "@nextui-org/chip";
import { subtitle, title } from "@/components/primitives";
import { useState, useRef } from "react";
import { InfoIcon, Leaf, AlertTriangle, Droplet } from "lucide-react";

interface PredictionResponse {
  class: string;
  confidence: number;
}

const DISEASE_INFO = {
  'diseased cotton leaf': {
    description: 'The cotton leaf shows signs of disease, which may affect the plant\'s ability to photosynthesize effectively. Common symptoms include spots, discoloration, or abnormal growth patterns.',
    care: 'Immediately isolate affected plants. Consider applying appropriate fungicides or pesticides after identifying the specific disease. Monitor surrounding plants for similar symptoms.'
  },
  'diseased cotton plant': {
    description: 'The entire cotton plant exhibits disease symptoms, which could indicate a systemic infection affecting multiple parts of the plant including stems, leaves, and possibly bolls.',
    care: 'Remove severely affected plants to prevent disease spread. Implement proper field sanitation. Consider crop rotation for the next season. Consult with agricultural experts for disease-specific treatment.'
  },
  'fresh cotton leaf': {
    description: 'The cotton leaf appears healthy with normal coloration and growth patterns. Healthy leaves are essential for proper photosynthesis and cotton development.',
    care: 'Maintain regular irrigation schedule. Continue balanced fertilization program. Monitor regularly for early signs of pest infestation or disease.'
  },
  'fresh cotton plant': {
    description: 'The cotton plant shows signs of good health with proper growth and development. Healthy plants typically produce better yield and fiber quality.',
    care: 'Continue current management practices. Ensure adequate spacing between plants. Monitor soil moisture levels and maintain optimal growing conditions.'
  }
};

export default function CottonDiseaseClassifier() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setPrediction(null);

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PredictionResponse = await response.json();
      setPrediction(data);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader className="flex-col items-start px-6 py-4">
          <div className="inline-block max-w-xl text-center justify-center">
            <span className={title()}>Cotton Disease&nbsp;</span>
            <span className={title({ color: "violet" })}>Classifier&nbsp;</span>
            <div className={subtitle({ class: "mt-4" })}>
              Upload an image to check the health status of your cotton plant.
            </div>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="flex justify-center items-center gap-2 bg-default-100 p-4 rounded-lg">
            <InfoIcon className="w-5 h-5 text-default-600" />
            <p className="text-sm text-default-600">
              Model can identify: diseased cotton leaf, diseased cotton plant, fresh cotton leaf, and fresh cotton plant.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="imageUpload"
            />
            <Button
              onClick={triggerFileInput}
              color="primary"
              className="w-full md:w-auto cursor-pointer"
            >
              Select Image
            </Button>
          </div>

          {preview && (
            <div className="mt-4">
              <Image
                src={preview}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {error && (
            <p className="text-danger mt-2">{error}</p>
          )}

          <Button
            color="success"
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!selectedFile || loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Processing...' : 'Analyze Image'}
          </Button>

          {loading && (
            <Progress
              size="sm"
              isIndeterminate
              aria-label="Loading..."
              className="max-w-md"
            />
          )}

          {prediction && (
            <PredictionResults prediction={prediction} />
          )}
        </CardBody>
      </Card>
    </main>
  );
}

interface PredictionResultsProps {
  prediction: PredictionResponse;
}

const PredictionResults = ({ prediction }: PredictionResultsProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  const isDiseased = prediction.class.includes('diseased');
  const confidenceColor = getConfidenceColor(prediction.confidence);

  return (
    <div className="space-y-6">
      <Card className={`bg-gradient-to-r ${isDiseased ? 'from-danger-50 to-warning-50' : 'from-success-50 to-primary-50'}`}>
        <CardBody className="flex flex-row items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isDiseased ? 'bg-danger-100' : 'bg-success-100'}`}>
              {isDiseased ? (
                <AlertTriangle className="w-8 h-8 text-danger-600" />
              ) : (
                <Leaf className="w-8 h-8 text-success-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-default-600">Analysis Result</p>
              <h3 className={`text-2xl font-bold ${isDiseased ? 'text-danger-600' : 'text-success-600'}`}>
                {prediction.class}
              </h3>
            </div>
          </div>
          <Chip
            size="lg"
            color={confidenceColor}
            variant="flat"
            className="px-4"
          >
            {(prediction.confidence * 100).toFixed(1)}% Confidence
          </Chip>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-default-600">Confidence Level</span>
              <span className="text-sm font-medium text-default-600">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={prediction.confidence * 100}
              color={confidenceColor}
              className="h-3"
              aria-label="Classification Confidence"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="bg-default-50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-primary-500" />
            <h4 className="text-lg font-semibold">Condition Details</h4>
          </div>
          <p className="text-default-700 leading-relaxed">
            {DISEASE_INFO[prediction.class as keyof typeof DISEASE_INFO].description}
          </p>
        </CardBody>
      </Card>

      <Card className="bg-default-50">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Droplet className="w-5 h-5 text-primary-500" />
            <h4 className="text-lg font-semibold">Recommended Actions</h4>
          </div>
          <div className="p-4 bg-default-100 rounded-lg">
            <p className="text-default-700 leading-relaxed">
              {DISEASE_INFO[prediction.class as keyof typeof DISEASE_INFO].care}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};