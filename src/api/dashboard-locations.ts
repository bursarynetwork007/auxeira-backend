import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard/locations
 * Get all dashboard file locations
 */
router.get('/', async (req, res) => {
  try {
    const locations = await prisma.dashboardLocation.findMany({
      orderBy: { dashboardType: 'asc' }
    });

    // Check if files actually exist at the recorded locations
    const locationsWithStatus = locations.map(location => ({
      ...location,
      fileExists: fs.existsSync(location.currentPath),
      fileSize: fs.existsSync(location.currentPath) 
        ? fs.statSync(location.currentPath).size 
        : 0
    }));

    res.json({
      locations: locationsWithStatus,
      total: locationsWithStatus.length,
      active: locationsWithStatus.filter(l => l.isActive && l.fileExists).length
    });
  } catch (error) {
    console.error('Error fetching dashboard locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/locations/:type
 * Get specific dashboard location
 */
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const location = await prisma.dashboardLocation.findUnique({
      where: { dashboardType: type }
    });

    if (!location) {
      return res.status(404).json({ error: 'Dashboard type not found' });
    }

    // Check if file exists
    const fileExists = fs.existsSync(location.currentPath);
    const fileInfo = fileExists ? {
      size: fs.statSync(location.currentPath).size,
      modified: fs.statSync(location.currentPath).mtime
    } : null;

    res.json({
      ...location,
      fileExists,
      fileInfo
    });
  } catch (error) {
    console.error('Error fetching dashboard location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/dashboard/locations/:type
 * Update dashboard location
 */
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { currentPath, notes, isActive } = req.body;

    // Validate path if provided
    if (currentPath && !fs.existsSync(currentPath)) {
      return res.status(400).json({ 
        error: 'File not found at specified path',
        path: currentPath 
      });
    }

    const location = await prisma.dashboardLocation.upsert({
      where: { dashboardType: type },
      update: {
        ...(currentPath && { currentPath }),
        ...(notes && { notes }),
        ...(isActive !== undefined && { isActive }),
        lastAccessed: new Date()
      },
      create: {
        dashboardType: type,
        originalPath: currentPath || `/workspaces/auxeira-backend/dashboard/${type}.html`,
        currentPath: currentPath || `/workspaces/auxeira-backend/dashboard/${type}.html`,
        notes: notes || `Dashboard for ${type}`,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json({
      message: 'Dashboard location updated successfully',
      location
    });
  } catch (error) {
    console.error('Error updating dashboard location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/dashboard/locations/:type/scan
 * Auto-discover dashboard file location
 */
router.post('/:type/scan', async (req, res) => {
  try {
    const { type } = req.params;
    const commonLocations = [
      `/workspaces/auxeira-backend/dashboard/${type}.html`,
      `/workspaces/auxeira-backend/public/${type}.html`,
      `/workspaces/auxeira-backend/src/dashboard/${type}.html`,
      `/workspaces/auxeira-backend/dist/${type}.html`,
      `/workspaces/auxeira-backend/${type}.html`,
      `./dashboard/${type}.html`,
      `./public/${type}.html`,
      `./src/dashboard/${type}.html`
    ];

    let foundPath = null;
    for (const location of commonLocations) {
      if (fs.existsSync(location)) {
        foundPath = location;
        break;
      }
    }

    if (foundPath) {
      // Update the database with found location
      const location = await prisma.dashboardLocation.upsert({
        where: { dashboardType: type },
        update: {
          currentPath: foundPath,
          isActive: true,
          lastAccessed: new Date(),
          notes: `Auto-discovered at ${foundPath}`
        },
        create: {
          dashboardType: type,
          originalPath: foundPath,
          currentPath: foundPath,
          isActive: true,
          notes: `Auto-discovered at ${foundPath}`
        }
      });

      res.json({
        message: 'Dashboard file found and location updated',
        location,
        discovered: true
      });
    } else {
      res.status(404).json({
        error: 'Dashboard file not found in common locations',
        searchedLocations: commonLocations,
        discovered: false
      });
    }
  } catch (error) {
    console.error('Error scanning for dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
