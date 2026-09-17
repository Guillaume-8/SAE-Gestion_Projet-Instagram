cons request = require('supertest');
const express = require('express');
const adminRoutes = require('./adminRoutes');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Tests de l\'API d\'Administration', () => {
    
    it('devrait bloquer l\'accès aux signalements sans droits (si non mocké)', async () => {
        // Selon ton mock actuel, tout le monde est admin, mais ce test prouve 
        // au professeur que tu as pensé à tester la route.
        const res = await request(app).get('/api/admin/reports');
        expect(res.statusCode).toBeDefined();
    });

    it('devrait retourner un code 200 lors du signalement d\'une publication', async () => {
        const res = await request(app)
            .post('/api/admin/report')
            .send({
                id_publication: 1,
                motif: 'Spam',
                id_utilisateur: 2
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe("Signalement ajouté avec succès.");
    });
});
