import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'


const getSearchLogs = async (supabase, userId)=>{
    const { data , error  } = await supabase
      .from('search_log')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
}

const getVisitedLogs = async (supabase, userId)=>{
    const { data , error  } = await supabase
      .from('visited_log')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
}

const getProperties = async (supabase)=>{
    const { data , error  } = await supabase
      .from('properties')
      .select('*');
    if (error) throw error;
    return data;
}

const generateRecommendations = async (searchLogs, visitedLogs, properties) => {
  const recommendations: any[] = [];
    
  // Get unique property_ids from visitedLogs
  const visitedPropertyIds = visitedLogs.map((log) => log.property_id);

  // Get a list of unique search types in format searchTypes = ['apartment', 'house', 'villa']
  let searchTypes = searchLogs.map((log) => log.types).filter((value, index, self) => self.indexOf(value) === index);
  // Flatten searchTypes array
  searchTypes = searchTypes.flat();

  console.log("searchTypes", searchTypes);

  // Get a mean of all search_log prices
  const meanPriceMin = searchLogs.reduce((acc, log) => acc + log.price_min, 0) / searchLogs.length;
  const meanPriceMax = searchLogs.reduce((acc, log) => acc + log.price_max, 0) / searchLogs.length;
  const meanPrice = (meanPriceMin + meanPriceMax) / 2;

  console.log("meanPrice", meanPrice);

  // Get a mean of all search_log sizes
  const meanSizeMin = searchLogs.reduce((acc, log) => acc + log.size_min, 0) / searchLogs.length;
  const meanSizeMax = searchLogs.reduce((acc, log) => acc + log.size_max, 0) / searchLogs.length;
  const meanSize = (meanSizeMin + meanSizeMax) / 2;

  console.log("meanSize", meanSize);

  // Find all properties that have size 50 plus or minus the mean size 
  // Find all properties that have price 100 plus or minus the mean price
  const recommendedProperties = properties.filter((property) => {
    return (
      Math.abs(property.size - meanSize) <= 5000 &&
      Math.abs(property.price - meanPrice) <= 100000 &&
      !visitedPropertyIds.includes(property.id) &&
      searchTypes.includes(property.type)
    );
  });

  // Randomly select 1 property from the recommended properties, if there are any, and add it to the recommendations
  if (recommendedProperties.length > 0) {
    recommendations.push(recommendedProperties[Math.floor(Math.random() * recommendedProperties.length)]);
  } 

  return recommendations;
}


serve(async (req)=>{

    // Enable CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: {
            headers: {
                Authorization: ("Bearer " + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? ""
            }
        }
    });
    try {
        const data = await req.json();
        const userId = data.userId;
        // Get all data with promise.all
        const [searchLogs, visitedLogs, properties] = await Promise.all([
            getSearchLogs(supabase, userId),
            getVisitedLogs(supabase, userId),
            getProperties(supabase)
        ]);

        const recommendations = await generateRecommendations(searchLogs, visitedLogs, properties);

        return new Response(JSON.stringify({
            recommendations: recommendations
        }), {
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            },
            status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({
            message: error.message
        }), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 400
        });
    }
});
