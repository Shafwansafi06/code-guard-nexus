import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users, FileText, Building2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: '',
    subject: '',
    student_count: '',
    expected_submissions: '',
    institution: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/profile/setup', {
        full_name: formData.full_name,
        subject: formData.subject,
        student_count: parseInt(formData.student_count),
        expected_submissions: parseInt(formData.expected_submissions),
        institution: formData.institution || undefined,
      });

      toast({
        title: 'Welcome aboard! 🎉',
        description: 'Your profile has been set up successfully.',
      });

      onComplete();
    } catch (error: any) {
      console.error('Failed to setup profile:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to setup profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.full_name.length >= 2 && formData.subject.length >= 2;
  const canProceedStep2 = 
    parseInt(formData.student_count) > 0 && 
    parseInt(formData.expected_submissions) > 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 ? 'Welcome to CodeGuard Nexus! 👋' : 'Tell us about your class'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Let\'s get you set up in just a few steps'
              : 'This helps us personalize your experience'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  placeholder="e.g., Prof. John Smith"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Subject You Teach *
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g., Computer Science"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Institution (Optional)
                </Label>
                <Input
                  id="institution"
                  placeholder="e.g., Stanford University"
                  value={formData.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="student_count" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Students *
                </Label>
                <Input
                  id="student_count"
                  type="number"
                  min="1"
                  placeholder="e.g., 30"
                  value={formData.student_count}
                  onChange={(e) => handleChange('student_count', e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Total students across all your classes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_submissions" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Expected Submissions Per Week *
                </Label>
                <Input
                  id="expected_submissions"
                  type="number"
                  min="1"
                  placeholder="e.g., 50"
                  value={formData.expected_submissions}
                  onChange={(e) => handleChange('expected_submissions', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Helps us optimize performance for your workload
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedStep2 || loading}
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
