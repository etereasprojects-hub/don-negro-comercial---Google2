'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface StoreConfig {
  store_name: string;
  email: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

interface StoreHours {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function Contact() {
  const { toast } = useToast();
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [hours, setHours] = useState<StoreHours[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [visitData, setVisitData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    loadConfiguration();
    loadLocations();
    loadHours();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('store_configuration')
        .select('store_name, email')
        .maybeSingle();

      if (error) throw error;
      if (data) setConfig(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('store_locations')
        .select('*')
        .order('created_at');

      if (error) throw error;
      if (data) setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadHours = async () => {
    try {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      if (data) setHours(data);
    } catch (error) {
      console.error('Error loading hours:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('web_messages').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Mensaje enviado',
        description: 'Nos pondremos en contacto contigo pronto.',
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('appointments').insert([
        {
          client_name: visitData.name,
          client_email: visitData.email,
          client_phone: visitData.phone,
          appointment_date: visitData.date,
          appointment_time: visitData.time,
          duration_minutes: 60,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Visita agendada',
        description: `Tu visita ha sido agendada para el ${visitData.date} a las ${visitData.time}.`,
      });
      setVisitData({ name: '', email: '', phone: '', date: '', time: '' });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agendar la visita. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section id="contacto" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
              Contacto
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Estamos aquí para ayudarte. Escríbenos o visítanos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#2E3A52]">
                Envíanos un Mensaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario de contacto">
                <div>
                  <label htmlFor="contact-name" className="sr-only">Tu nombre</label>
                  <Input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    aria-required="true"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">Tu email</label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="Tu email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    aria-required="true"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="sr-only">Tu teléfono</label>
                  <Input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="Tu teléfono"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    aria-required="true"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="sr-only">Tu mensaje</label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="Tu mensaje"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={4}
                    required
                    aria-required="true"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#D91E7A] to-[#6B4199] hover:opacity-90 text-white"
                  aria-label="Enviar mensaje de contacto"
                >
                  Enviar Mensaje
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#2E3A52]">
                  Agenda tu Visita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVisitSubmit} className="space-y-4" aria-label="Formulario de agenda de visita">
                  <div>
                    <label htmlFor="visit-name" className="sr-only">Tu nombre</label>
                    <Input
                      id="visit-name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre"
                      value={visitData.name}
                      onChange={(e) =>
                        setVisitData({ ...visitData, name: e.target.value })
                      }
                      required
                      aria-required="true"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="visit-email" className="sr-only">Tu email</label>
                    <Input
                      id="visit-email"
                      name="email"
                      type="email"
                      placeholder="Tu email"
                      value={visitData.email}
                      onChange={(e) =>
                        setVisitData({ ...visitData, email: e.target.value })
                      }
                      required
                      aria-required="true"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="visit-phone" className="sr-only">Tu teléfono</label>
                    <Input
                      id="visit-phone"
                      name="phone"
                      type="tel"
                      placeholder="Tu teléfono"
                      value={visitData.phone}
                      onChange={(e) =>
                        setVisitData({ ...visitData, phone: e.target.value })
                      }
                      required
                      aria-required="true"
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label htmlFor="visit-date" className="sr-only">Fecha de la visita</label>
                    <Input
                      id="visit-date"
                      name="date"
                      type="date"
                      value={visitData.date}
                      onChange={(e) =>
                        setVisitData({ ...visitData, date: e.target.value })
                      }
                      required
                      aria-required="true"
                      aria-label="Fecha de la visita"
                    />
                  </div>
                  <div>
                    <label htmlFor="visit-time" className="sr-only">Hora de la visita</label>
                    <Input
                      id="visit-time"
                      name="time"
                      type="time"
                      value={visitData.time}
                      onChange={(e) =>
                        setVisitData({ ...visitData, time: e.target.value })
                      }
                      required
                      aria-required="true"
                      aria-label="Hora de la visita"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#D91E7A] to-[#6B4199] hover:opacity-90 text-white"
                    aria-label="Agendar visita"
                  >
                    <Calendar className="mr-2" size={18} aria-hidden="true" />
                    Agendar Visita
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white">
              <CardContent className="pt-6 space-y-4">
                {config?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <p className="text-white/90">{config.email}</p>
                    </div>
                  </div>
                )}

                {locations.length > 0 ? (
                  locations.map((location) => (
                    <div key={location.id} className="border-t border-white/20 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-start gap-3 mb-3">
                        <MapPin className="mt-1 flex-shrink-0" size={20} />
                        <div>
                          <h4 className="font-semibold mb-1">{location.name}</h4>
                          <p className="text-white/90">{location.address}</p>
                        </div>
                      </div>
                      {location.phone && (
                        <div className="flex items-start gap-3 ml-8">
                          <Phone className="mt-1 flex-shrink-0" size={20} />
                          <div>
                            <h4 className="font-semibold mb-1">Teléfono</h4>
                            <p className="text-white/90">{location.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/80 py-4">
                    No hay ubicaciones configuradas
                  </div>
                )}

                {hours.length > 0 && (
                  <div className="flex items-start gap-3 border-t border-white/20 pt-4">
                    <Clock className="mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold mb-1">Horario</h4>
                      {hours.map((hour) => (
                        <p key={hour.id} className="text-white/90">
                          {daysOfWeek[hour.day_of_week]}:{' '}
                          {hour.is_closed
                            ? 'Cerrado'
                            : `${hour.open_time} - ${hour.close_time}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
