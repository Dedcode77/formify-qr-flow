import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  QrCode, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  Search,
  UserCheck,
  Calendar
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockAttendance = [
  { id: '1', name: 'Marie Dupont', email: 'marie@example.com', checkIn: '09:02', checkOut: '18:15', method: 'qrcode', status: 'present' },
  { id: '2', name: 'Jean Martin', email: 'jean@example.com', checkIn: '08:55', checkOut: '17:30', method: 'manual', status: 'present' },
  { id: '3', name: 'Sophie Bernard', email: 'sophie@example.com', checkIn: '09:30', checkOut: null, method: 'form', status: 'present' },
  { id: '4', name: 'Pierre Petit', email: 'pierre@example.com', checkIn: null, checkOut: null, method: null, status: 'absent' },
  { id: '5', name: 'Claire Moreau', email: 'claire@example.com', checkIn: '08:45', checkOut: '16:00', method: 'qrcode', status: 'early' },
];

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const { toast } = useToast();

  const filteredAttendance = mockAttendance.filter((record) =>
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockAttendance.length,
    present: mockAttendance.filter((r) => r.status === 'present' || r.status === 'early').length,
    absent: mockAttendance.filter((r) => r.status === 'absent').length,
    rate: Math.round((mockAttendance.filter((r) => r.status !== 'absent').length / mockAttendance.length) * 100),
  };

  const handleManualCheckIn = () => {
    toast({
      title: 'Pointage enregistré',
      description: 'Le pointage manuel a été enregistré avec succès.',
    });
  };

  const qrCodeValue = `https://formy.app/attendance/check-in?org=demo-org&date=${new Date().toISOString().split('T')[0]}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestion de présence</h1>
            <p className="text-muted-foreground mt-1">
              Suivez les présences de votre équipe
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>QR Code de pointage</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center py-6">
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    <QRCodeSVG value={qrCodeValue} size={200} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Scannez ce QR code pour enregistrer votre présence
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="hero" onClick={handleManualCheckIn}>
              <UserCheck className="w-4 h-4 mr-2" />
              Pointage manuel
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total', value: stats.total, color: 'primary' },
            { icon: CheckCircle, label: 'Présents', value: stats.present, color: 'success' },
            { icon: XCircle, label: 'Absents', value: stats.absent, color: 'destructive' },
            { icon: Clock, label: 'Taux', value: `${stats.rate}%`, color: 'accent' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Attendance List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Présences du jour</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nom</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Arrivée</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Départ</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Méthode</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-muted-foreground">{record.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {record.checkIn || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {record.checkOut || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {record.method ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted">
                            {record.method === 'qrcode' && <QrCode className="w-3 h-3" />}
                            {record.method === 'manual' && <UserCheck className="w-3 h-3" />}
                            {record.method === 'form' && <Calendar className="w-3 h-3" />}
                            {record.method}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          record.status === 'present' 
                            ? 'bg-success/10 text-success' 
                            : record.status === 'early'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {record.status === 'present' && <CheckCircle className="w-3 h-3" />}
                          {record.status === 'early' && <Clock className="w-3 h-3" />}
                          {record.status === 'absent' && <XCircle className="w-3 h-3" />}
                          {record.status === 'present' ? 'Présent' : record.status === 'early' ? 'Parti tôt' : 'Absent'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredAttendance.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun résultat trouvé</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
