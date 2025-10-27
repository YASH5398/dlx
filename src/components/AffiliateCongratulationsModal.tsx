import React from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/badge';
import ConfettiAnimation from './ConfettiAnimation';
import { 
  Crown, 
  Sparkles, 
  Trophy, 
  Star,
  CheckCircle,
  Gift,
  TrendingUp,
  Users
} from 'lucide-react';

interface AffiliateCongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionRate: number;
}

export default function AffiliateCongratulationsModal({ isOpen, onClose, commissionRate }: AffiliateCongratulationsModalProps) {
  const features = [
    "Access to exclusive partner dashboard",
    "Real-time commission tracking",
    "Weekly payout schedule",
    "Dedicated partner support team",
    "Marketing materials and resources"
  ];

  return (
    <>
      <ConfettiAnimation isActive={isOpen} />
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full">
            <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-yellow-200 dark:border-yellow-700 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl animate-pulse">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center animate-bounce">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                <CardTitle className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  🎉 Congratulations! 🎉
                </CardTitle>
                <CardDescription className="text-xl text-slate-700 dark:text-slate-300 mb-4">
                  You're now an official DLX Affiliate Partner!
                </CardDescription>
                
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-lg px-6 py-2">
                  <Crown className="w-5 h-5 mr-2" />
                  Affiliate Partner ✅
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Commission Rate Display */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {commissionRate}%
                    </div>
                    <div className="text-lg text-slate-700 dark:text-slate-300 font-medium">
                      Your Commission Rate
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Earn on every successful referral
                    </div>
                  </div>
                </div>

                {/* What's Next */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    What's Next?
                  </h3>
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{commissionRate}%</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Commission Rate</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">∞</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Referral Limit</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={onClose}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    Start Earning Now!
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg"
                  >
                    View Dashboard
                  </Button>
                </div>

                {/* Celebration Message */}
                <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    🎊 Welcome to the DLX Family! 🎊
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Your journey to financial freedom starts now!
                  </div>
                </div>
              </CardContent>
            </Card>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
