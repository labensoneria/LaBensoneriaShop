import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    question: '¿Cuánto tarda en prepararse mi pedido?',
    answer: (
      <>
        <p>
          Cada peluche y llavero lo hago yo misma, con mis propias manos y mucho cariño, así que el tiempo de
          preparación puede variar un poco según los pedidos que tenga en ese momento y lo elaborado que sea tu pieza.
        </p>
        <p className="mt-2">
          En general, calcula entre <span className="font-medium">1 y 3 semanas</span> desde que confirmas tu pedido.
          Si tienes alguna fecha límite en mente (un cumpleaños, un regalo especial…), escríbeme antes de comprar y
          vemos si puedo organizarme para llegar a tiempo. ¡Siempre intento hacer lo posible!
        </p>
      </>
    ),
  },
  {
    question: '¿Cuánto tarda en llegar una vez enviado?',
    answer: (
      <>
        <p>Los envíos se realizan a través de <span className="font-medium">Correos</span>. Una vez que tu pedido sale de mis manos, los tiempos orientativos son:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li><span className="font-medium">Península y Baleares:</span> 48–72 horas hábiles.</li>
          <li><span className="font-medium">Canarias:</span> aproximadamente 7–10 días hábiles (incluye tramitación aduanera).</li>
          <li><span className="font-medium">Ceuta y Melilla:</span> aproximadamente 8–11 días hábiles (incluye tramitación aduanera).</li>
        </ul>
        <p className="mt-2 text-brand-dark/60 text-sm">
          Estos plazos son los habituales de Correos y pueden verse afectados por épocas de alta demanda (Navidad,
          rebajas, etc.). Te envío el número de seguimiento en cuanto lo tenga para que puedas rastrear tu paquete.
        </p>
      </>
    ),
  },
  {
    question: '¿A dónde hacéis envíos?',
    answer: (
      <p>
        ¡A toda España! Península, Baleares, Canarias, Ceuta y Melilla. Si estás fuera de España y te encapricha
        algo, escríbeme a{' '}
        <a href="mailto:lunekoshop@gmail.com" className="text-brand-green hover:underline">
          lunekoshop@gmail.com
        </a>{' '}
        y lo miramos juntos.
      </p>
    ),
  },
  {
    question: '¿Puedo devolver mi pedido?',
    answer: (
      <>
        <p>
          Sí, tienes <span className="font-medium">14 días naturales desde que recibes tu pedido</span> para
          solicitar una devolución. La única condición es que el artículo llegue en perfecto estado, sin usar y con
          su embalaje original.
        </p>
        <p className="mt-2">
          Para iniciar una devolución, escríbeme a{' '}
          <a href="mailto:lunekoshop@gmail.com" className="text-brand-green hover:underline">
            lunekoshop@gmail.com
          </a>{' '}
          con tu número de pedido y te explico los pasos. Los gastos de envío de la devolución corren por cuenta del
          comprador salvo que el producto llegue defectuoso o equivocado (que en ese caso, lo soluciono yo sin que te
          cueste nada).
        </p>
      </>
    ),
  },
  {
    question: '¿Puedo cancelar mi pedido?',
    answer: (
      <>
        <p>
          Puedes cancelar tu pedido de forma gratuita dentro de las{' '}
          <span className="font-medium">24 horas siguientes</span> a haberlo realizado, siempre que aún no haya
          empezado a prepararse.
        </p>
        <p className="mt-2">
          Pasado ese plazo, al ser productos hechos a mano y elaborados específicamente para ti, no es posible
          cancelar el pedido. Si tienes alguna duda antes de comprar, pregúntame sin compromiso.
        </p>
      </>
    ),
  },
  {
    question: '¿Puedo pedir un diseño personalizado?',
    answer: (
      <p>
        ¡Me encanta la idea! Aunque en la tienda solo aparecen los diseños disponibles en este momento, si tienes
        algo especial en mente puedes escribirme a{' '}
        <a href="mailto:lunekoshop@gmail.com" className="text-brand-green hover:underline">
          lunekoshop@gmail.com
        </a>{' '}
        o por Instagram{' '}
        <a
          href="https://www.instagram.com/la_bensoneria/"
          target="_blank"
          rel="noreferrer"
          className="text-brand-green hover:underline"
        >
          @la_bensoneria
        </a>{' '}
        y lo hablamos. Valoro cada encargo con mucho gusto.
      </p>
    ),
  },
];

function FaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-brand-greenLight/40 last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left text-brand-dark hover:text-brand-green transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-base">{item.question}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-5 h-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-brand-dark/75 text-sm leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-2">Preguntas frecuentes</h1>
      <p className="text-brand-dark/60 mb-10">
        ¿Tienes alguna duda? Aquí resuelvo las más habituales. Si no encuentras lo que buscas, escríbeme sin dudar.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-greenLight/30 px-6">
        {faqs.map((item) => (
          <FaqItem key={item.question} item={item} />
        ))}
      </div>

      {/* Contacto */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-brand-dark mb-2">¿No encuentras lo que buscas?</h2>
        <p className="text-brand-dark/60 mb-6 text-sm">
          No hay pregunta tonta. Escríbeme por el canal que más te apetezca y te respondo lo antes posible.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:lunekoshop@gmail.com"
            className="flex items-start gap-4 bg-white rounded-2xl border border-brand-greenLight/30 shadow-sm p-5 hover:border-brand-green/50 hover:shadow-md transition-all group"
          >
            <div className="mt-0.5 p-2.5 rounded-xl bg-brand-cream group-hover:bg-brand-greenLight/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-brand-dark text-sm">Correo electrónico</p>
              <p className="text-brand-dark/50 text-xs mt-0.5">lunekoshop@gmail.com</p>
              <p className="text-brand-dark/40 text-xs mt-1">Suelo responder en 24–48 h</p>
            </div>
          </a>

          <a
            href="https://www.instagram.com/la_bensoneria/"
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-4 bg-white rounded-2xl border border-brand-greenLight/30 shadow-sm p-5 hover:border-brand-green/50 hover:shadow-md transition-all group"
          >
            <div className="mt-0.5 p-2.5 rounded-xl bg-brand-cream group-hover:bg-brand-greenLight/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-brand-dark text-sm">Instagram</p>
              <p className="text-brand-dark/50 text-xs mt-0.5">@la_bensoneria</p>
              <p className="text-brand-dark/40 text-xs mt-1">DM abiertos, ¡escríbeme!</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
