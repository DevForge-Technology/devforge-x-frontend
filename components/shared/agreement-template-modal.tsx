import React from 'react';
import { useGenerateAgreementMutation } from '@/lib/api/hooks/useCompanies';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useFormik } from 'formik';
import { Button, Input} from '@/shared/ui';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div style={{ height: '150px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
});

interface AgreementTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  initialEmail?: string;
  companyName?: string;
  vendorName?: string;
}

export const AgreementTemplateModal = NiceModal.create<AgreementTemplateModalProps>(({
  companyId,
  initialEmail = '',
  companyName = '',
  vendorName = '',
}) => {
  const modal = useModal(AgreementTemplateModal);
  const { mutateAsync: generateAgreement, isPending } = useGenerateAgreementMutation();

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      message: '',
      scheduleNo: '',
      scheduleDate: '',
      referredClient: '',
      engagementName: '',
      scopeSummary: '',
      totalClientContractValue: '',
      numberOfProgressPayments: '',
      expectedEngagementStart: '',
      totalReferralFee: '',
      numberOfInstalments: '',
      instalmentAmount: '',
      accountName: '',
      bsbAccount: '',
    },
    onSubmit: async (values) => {
      try {
        const payload: any = {
          companyId,
          email: values.email,
          message: values.message || undefined,
        };

        const numericFields = [
          'totalClientContractValue',
          'numberOfProgressPayments',
          'totalReferralFee',
          'numberOfInstalments',
          'instalmentAmount'
        ];

        Object.entries(values).forEach(([key, value]) => {
          if (key !== 'email' && key !== 'message' && value !== '') {
            if (numericFields.includes(key)) {
              payload[key] = Number(value);
            } else {
              payload[key] = value;
            }
          }
        });

        const blob = await generateAgreement(payload);

        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Referral_Agreement_${values.scheduleNo || companyId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        modal.hide();
      } catch (error) {
        console.error(error);
        alert('An error occurred while compiling and dispatching the agreement portfolio.');
      }
    },
  });

  if (!modal.visible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 auto" style={{ zIndex: 1000, overflowY: 'auto' }}>
      <style>
        {`
          .small-placeholder::placeholder {
            font-size: 11px !important;
            color: #94a3b8 !important;
            font-weight: 400;
          }
          .quill-container .ql-editor {
            min-height: 120px;
            max-height: 200px;
            font-size: 13px;
          }
          .quill-container .ql-editor.ql-blank::before {
            font-size: 11px !important;
            color: #94a3b8 !important;
            font-style: normal !important;
          }
            input[type="date"] {
      position: relative !important;
      display: flex !important;
    }
    input[type="date"]::-webkit-calendar-picker-indicator {
      position: absolute !important;
      right: 12px !important;
      margin: 0 !important;
      padding: 0 !important;
      cursor: pointer !important;
    }
  `}
        
      </style>
      
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Generate & Send Referral Agreement</h3>
        
        <form onSubmit={formik.handleSubmit}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Email Transmission Parameters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Recipient Email</Label>
                <Input type="email" name="email" required value={formik.values.email} onChange={formik.handleChange} placeholder="Recipient email address" className="small-placeholder" />
              </div>
              <div className="quill-container">
                <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Cover Message</Label>
                <ReactQuill theme="snow" value={formik.values.message} onChange={(val) => formik.setFieldValue('message', val)} placeholder="Type your message here" modules={{ toolbar: [['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']] }} />
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Agreement Schedule Specification Data</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            
            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Schedule No</Label>
              <Input type="text" name="scheduleNo" value={formik.values.scheduleNo} onChange={formik.handleChange} placeholder="Schedule number" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Schedule Date</Label>
              <Input type={"date" as any} name="scheduleDate" value={formik.values.scheduleDate} onChange={formik.handleChange} className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Referred Client</Label>
              <Input type="text" name="referredClient" value={formik.values.referredClient} onChange={formik.handleChange} placeholder="Client name" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Engagement Name</Label>
              <Input type="text" name="engagementName" value={formik.values.engagementName} onChange={formik.handleChange} placeholder="Engagement name" className="small-placeholder" />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Scope Summary</Label>
              <Textarea name="scopeSummary" value={formik.values.scopeSummary} onChange={formik.handleChange} placeholder="Scope summary details" className="small-placeholder" style={{ minHeight: '50px' }} />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Contract Value (AUD)</Label>
              <Input type="number" name="totalClientContractValue" value={formik.values.totalClientContractValue} onChange={formik.handleChange} placeholder="Total contract value" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Progress Payments Count</Label>
              <Input type="number" name="numberOfProgressPayments" value={formik.values.numberOfProgressPayments} onChange={formik.handleChange} placeholder="Number of progress payments" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Expected Start Date</Label>
              <Input type={"date" as any} name="expectedEngagementStart" value={formik.values.expectedEngagementStart} onChange={formik.handleChange} className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Referral Fee (AUD)</Label>
              <Input type="number" name="totalReferralFee" value={formik.values.totalReferralFee} onChange={formik.handleChange} placeholder="Total referral fee" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Installments Count</Label>
              <Input type="number" name="numberOfInstalments" value={formik.values.numberOfInstalments} onChange={formik.handleChange} placeholder="Number of installments" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Installment Amount (AUD)</Label>
              <Input type="number" name="instalmentAmount" value={formik.values.instalmentAmount} onChange={formik.handleChange} placeholder="Installment amount" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Account Name</Label>
              <Input type="text" name="accountName" value={formik.values.accountName} onChange={formik.handleChange} placeholder="Account name" className="small-placeholder" />
            </div>

            <div>
              <Label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>BSB & Account Details</Label>
              <Input type="text" name="bsbAccount" value={formik.values.bsbAccount} onChange={formik.handleChange} placeholder="Account details" className="small-placeholder" />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={() => modal.hide()} disabled={isPending}>
              Cancel
            </Button>
            
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700 font-medium min-w-[145px]">
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="absolute flex items-center justify-center" style={{ visibility: isPending ? 'visible' : 'hidden' }}><Loader2 className="h-4 w-4 animate-spin" /></span>
                <span style={{ visibility: isPending ? 'hidden' : 'visible' }}>Generate & Send</span>
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});